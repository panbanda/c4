mod docs;
mod hub;
mod watcher;

pub use docs::{build_navigation, extract_title, render_navigation, rewrite_markdown_links, DocsHandler, NavItem};
pub use hub::{Client, Hub};
pub use watcher::Watcher;

use axum::{
    extract::{ws::WebSocket, Path, State, WebSocketUpgrade},
    http::StatusCode,
    response::{IntoResponse, Json, Response},
    routing::{get, put},
    Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tower_http::cors::CorsLayer;

#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub work_dir: PathBuf,
    pub no_reload: bool,
    pub verbose: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            work_dir: PathBuf::from("."),
            no_reload: false,
            verbose: false,
        }
    }
}

#[derive(Clone)]
pub struct ServerState {
    hub: Arc<Hub>,
    model: Arc<RwLock<Option<serde_json::Value>>>,
    config: Config,
}

pub struct Server {
    state: ServerState,
    watcher: Option<Watcher>,
}

impl Server {
    pub fn new(config: Config) -> Result<Self, Box<dyn std::error::Error>> {
        let hub = Arc::new(Hub::new());
        let state = ServerState {
            hub: hub.clone(),
            model: Arc::new(RwLock::new(None)),
            config: config.clone(),
        };

        let watcher = if !config.no_reload {
            let state_clone = state.clone();
            Some(Watcher::new(config.work_dir.clone(), move |path| {
                let state = state_clone.clone();
                tokio::spawn(async move {
                    if state.config.verbose {
                        eprintln!("File changed: {}", path);
                    }
                    state
                        .hub
                        .broadcast(br#"{"type":"reload"}"#.to_vec());
                });
            })?)
        } else {
            None
        };

        Ok(Self { state, watcher })
    }

    pub async fn run(self) -> Result<(), Box<dyn std::error::Error>> {
        let hub = self.state.hub.clone();
        tokio::spawn(async move {
            hub.run().await;
        });

        let app = self.create_router();

        let addr = SocketAddr::from(([127, 0, 0, 1], self.state.config.port));

        if self.state.config.verbose {
            eprintln!("Server running at http://{}", addr);
        }

        let listener = TcpListener::bind(addr).await?;
        axum::serve(listener, app).await?;

        Ok(())
    }

    pub async fn shutdown(mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(mut watcher) = self.watcher.take() {
            watcher.close().await?;
        }
        self.state.hub.stop();
        Ok(())
    }

    pub async fn set_model(&self, model: serde_json::Value) {
        let mut m = self.state.model.write().await;
        *m = Some(model);
    }

    fn create_router(&self) -> Router {
        Router::new()
            .route("/api/model", get(handle_get_model))
            .route("/api/health", get(handle_health))
            .route(
                "/api/elements/:element_type/:id",
                put(handle_update_element),
            )
            .route("/ws", get(handle_websocket))
            .route("/docs/*path", get(handle_docs))
            .layer(CorsLayer::permissive())
            .with_state(self.state.clone())
    }
}

async fn handle_get_model(State(state): State<ServerState>) -> Response {
    let model = state.model.read().await;

    match model.as_ref() {
        Some(m) => Json(m.clone()).into_response(),
        None => Json(serde_json::json!({})).into_response(),
    }
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    clients: usize,
}

async fn handle_health(State(state): State<ServerState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        clients: state.hub.client_count().await,
    })
}

#[derive(Deserialize)]
struct ElementUpdate {
    #[serde(flatten)]
    fields: serde_json::Map<String, serde_json::Value>,
}

async fn handle_update_element(
    State(state): State<ServerState>,
    Path((element_type, id)): Path<(String, String)>,
    Json(update): Json<ElementUpdate>,
) -> Response {
    if !["person", "system", "container", "component"].contains(&element_type.as_str()) {
        return (StatusCode::BAD_REQUEST, "Invalid element type").into_response();
    }

    if state.config.verbose {
        eprintln!("Updating {} {}: {:?}", element_type, id, update.fields);
    }

    state
        .hub
        .broadcast(br#"{"type":"reload"}"#.to_vec());

    let model = state.model.read().await;
    match model.as_ref() {
        Some(m) => Json(m.clone()).into_response(),
        None => Json(serde_json::json!({})).into_response(),
    }
}

async fn handle_websocket(
    ws: WebSocketUpgrade,
    State(state): State<ServerState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: ServerState) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

    let client_id = format!("client-{}", uuid::Uuid::new_v4());
    let client = Client::new(client_id.clone(), tx);

    state.hub.register(client);

    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            let axum_msg = match msg {
                WsMessage::Text(t) => axum::extract::ws::Message::Text(t),
                WsMessage::Binary(b) => axum::extract::ws::Message::Binary(b),
                WsMessage::Close(_) => axum::extract::ws::Message::Close(None),
                _ => continue,
            };
            if sender.send(axum_msg).await.is_err() {
                break;
            }
        }
    });

    let recv_task = tokio::spawn(async move {
        while receiver.next().await.is_some() {}
    });

    let _ = tokio::try_join!(send_task, recv_task);

    state.hub.unregister(client_id);
}

async fn handle_docs(
    State(state): State<ServerState>,
    path: Option<Path<String>>,
) -> Response {
    let handler = DocsHandler::new(&state.config.work_dir);
    handler.serve(path).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use tokio::time::{sleep, Duration};

    #[test]
    fn test_config_default() {
        let config = Config::default();

        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 8080);
        assert!(!config.no_reload);
        assert!(!config.verbose);
    }

    #[test]
    fn test_config_creation() {
        let config = Config {
            host: "localhost".to_string(),
            port: 3000,
            work_dir: PathBuf::from("/tmp"),
            no_reload: true,
            verbose: true,
        };

        assert_eq!(config.host, "localhost");
        assert_eq!(config.port, 3000);
        assert_eq!(config.work_dir, PathBuf::from("/tmp"));
        assert!(config.no_reload);
        assert!(config.verbose);
    }

    #[tokio::test]
    async fn test_server_creation() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config);
        assert!(server.is_ok());
    }

    #[tokio::test]
    async fn test_server_with_no_reload() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            no_reload: true,
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        assert!(server.watcher.is_none());
    }

    #[tokio::test]
    async fn test_server_with_reload() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            no_reload: false,
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        assert!(server.watcher.is_some());
    }

    #[tokio::test]
    async fn test_server_set_model() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();

        let model = serde_json::json!({
            "name": "test",
            "elements": []
        });

        server.set_model(model.clone()).await;

        let stored = server.state.model.read().await;
        assert_eq!(*stored, Some(model));
    }

    #[tokio::test]
    async fn test_health_endpoint() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let state = server.state.clone();

        let response = handle_health(State(state)).await;

        assert_eq!(response.0.status, "ok");
        assert_eq!(response.0.clients, 0);
    }

    #[tokio::test]
    async fn test_get_model_empty() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let state = server.state.clone();

        let _response = handle_get_model(State(state)).await;
    }

    #[tokio::test]
    async fn test_get_model_with_data() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let model = serde_json::json!({"test": "data"});
        server.set_model(model).await;

        let state = server.state.clone();
        let _response = handle_get_model(State(state)).await;
    }

    #[tokio::test]
    async fn test_update_element_invalid_type() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let state = server.state.clone();

        let update = ElementUpdate {
            fields: serde_json::Map::new(),
        };

        let response =
            handle_update_element(State(state), Path(("invalid".to_string(), "id".to_string())), Json(update))
                .await;

        let status = response.into_response().status();
        assert_eq!(status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_update_element_valid_types() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        for element_type in &["person", "system", "container", "component"] {
            let server = Server::new(config.clone()).unwrap();
            let state = server.state.clone();

            let update = ElementUpdate {
                fields: serde_json::Map::new(),
            };

            let response = handle_update_element(
                State(state),
                Path((element_type.to_string(), "id".to_string())),
                Json(update),
            )
            .await;

            let status = response.into_response().status();
            assert_eq!(status, StatusCode::OK);
        }
    }

    #[tokio::test]
    async fn test_server_shutdown() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let result = server.shutdown().await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_server_file_change_broadcast() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            no_reload: false,
            verbose: false,
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let state = server.state.clone();

        let hub = state.hub.clone();
        tokio::spawn(async move {
            hub.run().await;
        });

        sleep(Duration::from_millis(50)).await;

        let yaml_file = temp_dir.path().join("test.yaml");
        std::fs::write(&yaml_file, "test: value").unwrap();

        sleep(Duration::from_millis(300)).await;
    }

    #[tokio::test]
    async fn test_create_router() {
        let temp_dir = TempDir::new().unwrap();
        let config = Config {
            work_dir: temp_dir.path().to_path_buf(),
            ..Default::default()
        };

        let server = Server::new(config).unwrap();
        let _router = server.create_router();
    }
}
