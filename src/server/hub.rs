use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::tungstenite::Message as WsMessage;

#[derive(Debug, Clone)]
pub struct Client {
    pub id: String,
    pub send: mpsc::UnboundedSender<WsMessage>,
}

impl Client {
    pub fn new(id: String, send: mpsc::UnboundedSender<WsMessage>) -> Self {
        Self { id, send }
    }
}

pub struct Hub {
    clients: Arc<RwLock<Vec<Client>>>,
    register_tx: mpsc::UnboundedSender<Client>,
    register_rx: Arc<RwLock<mpsc::UnboundedReceiver<Client>>>,
    unregister_tx: mpsc::UnboundedSender<String>,
    unregister_rx: Arc<RwLock<mpsc::UnboundedReceiver<String>>>,
    broadcast_tx: mpsc::UnboundedSender<Vec<u8>>,
    broadcast_rx: Arc<RwLock<mpsc::UnboundedReceiver<Vec<u8>>>>,
    stop_tx: mpsc::UnboundedSender<()>,
    stop_rx: Arc<RwLock<mpsc::UnboundedReceiver<()>>>,
}

impl Hub {
    pub fn new() -> Self {
        let (register_tx, register_rx) = mpsc::unbounded_channel();
        let (unregister_tx, unregister_rx) = mpsc::unbounded_channel();
        let (broadcast_tx, broadcast_rx) = mpsc::unbounded_channel();
        let (stop_tx, stop_rx) = mpsc::unbounded_channel();

        Self {
            clients: Arc::new(RwLock::new(Vec::new())),
            register_tx,
            register_rx: Arc::new(RwLock::new(register_rx)),
            unregister_tx,
            unregister_rx: Arc::new(RwLock::new(unregister_rx)),
            broadcast_tx,
            broadcast_rx: Arc::new(RwLock::new(broadcast_rx)),
            stop_tx,
            stop_rx: Arc::new(RwLock::new(stop_rx)),
        }
    }

    pub async fn run(&self) {
        let mut register_rx = self.register_rx.write().await;
        let mut unregister_rx = self.unregister_rx.write().await;
        let mut broadcast_rx = self.broadcast_rx.write().await;
        let mut stop_rx = self.stop_rx.write().await;

        loop {
            tokio::select! {
                Some(client) = register_rx.recv() => {
                    let mut clients = self.clients.write().await;
                    clients.push(client);
                }
                Some(client_id) = unregister_rx.recv() => {
                    let mut clients = self.clients.write().await;
                    clients.retain(|c| c.id != client_id);
                }
                Some(message) = broadcast_rx.recv() => {
                    let clients = self.clients.read().await;
                    let ws_message = WsMessage::Binary(message);

                    for client in clients.iter() {
                        let _ = client.send.send(ws_message.clone());
                    }
                }
                Some(_) = stop_rx.recv() => {
                    let mut clients = self.clients.write().await;
                    clients.clear();
                    break;
                }
            }
        }
    }

    pub fn stop(&self) {
        let _ = self.stop_tx.send(());
    }

    pub fn register(&self, client: Client) {
        let _ = self.register_tx.send(client);
    }

    pub fn unregister(&self, client_id: String) {
        let _ = self.unregister_tx.send(client_id);
    }

    pub fn broadcast(&self, message: Vec<u8>) {
        let _ = self.broadcast_tx.send(message);
    }

    pub async fn client_count(&self) -> usize {
        self.clients.read().await.len()
    }
}

impl Default for Hub {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::{sleep, Duration};

    #[tokio::test]
    async fn test_hub_new() {
        let hub = Hub::new();
        assert_eq!(hub.client_count().await, 0);
    }

    #[tokio::test]
    async fn test_hub_register_client() {
        let hub = Hub::new();
        let hub_clone = Arc::new(hub);

        let hub_run = hub_clone.clone();
        let run_handle = tokio::spawn(async move {
            hub_run.run().await;
        });

        let (tx, _rx) = mpsc::unbounded_channel();
        let client = Client::new("test-client".to_string(), tx);

        hub_clone.register(client);

        sleep(Duration::from_millis(50)).await;

        assert_eq!(hub_clone.client_count().await, 1);

        hub_clone.stop();
        let _ = run_handle.await;
    }

    #[tokio::test]
    async fn test_hub_unregister_client() {
        let hub = Hub::new();
        let hub_clone = Arc::new(hub);

        let hub_run = hub_clone.clone();
        let run_handle = tokio::spawn(async move {
            hub_run.run().await;
        });

        let (tx, _rx) = mpsc::unbounded_channel();
        let client = Client::new("test-client".to_string(), tx);

        hub_clone.register(client);
        sleep(Duration::from_millis(50)).await;
        assert_eq!(hub_clone.client_count().await, 1);

        hub_clone.unregister("test-client".to_string());
        sleep(Duration::from_millis(50)).await;
        assert_eq!(hub_clone.client_count().await, 0);

        hub_clone.stop();
        let _ = run_handle.await;
    }

    #[tokio::test]
    async fn test_hub_broadcast() {
        let hub = Hub::new();
        let hub_clone = Arc::new(hub);

        let hub_run = hub_clone.clone();
        let run_handle = tokio::spawn(async move {
            hub_run.run().await;
        });

        let (tx1, mut rx1) = mpsc::unbounded_channel();
        let (tx2, mut rx2) = mpsc::unbounded_channel();

        let client1 = Client::new("client1".to_string(), tx1);
        let client2 = Client::new("client2".to_string(), tx2);

        hub_clone.register(client1);
        hub_clone.register(client2);
        sleep(Duration::from_millis(50)).await;

        let message = b"test message".to_vec();
        hub_clone.broadcast(message.clone());

        sleep(Duration::from_millis(50)).await;

        if let Some(msg) = rx1.recv().await {
            match msg {
                WsMessage::Binary(data) => assert_eq!(data, message),
                _ => panic!("Expected binary message"),
            }
        }

        if let Some(msg) = rx2.recv().await {
            match msg {
                WsMessage::Binary(data) => assert_eq!(data, message),
                _ => panic!("Expected binary message"),
            }
        }

        hub_clone.stop();
        let _ = run_handle.await;
    }

    #[tokio::test]
    async fn test_hub_multiple_clients() {
        let hub = Hub::new();
        let hub_clone = Arc::new(hub);

        let hub_run = hub_clone.clone();
        let run_handle = tokio::spawn(async move {
            hub_run.run().await;
        });

        for i in 0..5 {
            let (tx, _rx) = mpsc::unbounded_channel();
            let client = Client::new(format!("client{}", i), tx);
            hub_clone.register(client);
        }

        sleep(Duration::from_millis(50)).await;
        assert_eq!(hub_clone.client_count().await, 5);

        hub_clone.unregister("client2".to_string());
        hub_clone.unregister("client4".to_string());
        sleep(Duration::from_millis(50)).await;
        assert_eq!(hub_clone.client_count().await, 3);

        hub_clone.stop();
        let _ = run_handle.await;
    }

    #[tokio::test]
    async fn test_hub_stop() {
        let hub = Hub::new();
        let hub_clone = Arc::new(hub);

        let hub_run = hub_clone.clone();
        let run_handle = tokio::spawn(async move {
            hub_run.run().await;
        });

        let (tx, _rx) = mpsc::unbounded_channel();
        let client = Client::new("test-client".to_string(), tx);
        hub_clone.register(client);

        sleep(Duration::from_millis(50)).await;
        assert_eq!(hub_clone.client_count().await, 1);

        hub_clone.stop();
        let _ = run_handle.await;

        assert_eq!(hub_clone.client_count().await, 0);
    }

    #[tokio::test]
    async fn test_client_creation() {
        let (tx, _rx) = mpsc::unbounded_channel();
        let client = Client::new("test-id".to_string(), tx);

        assert_eq!(client.id, "test-id");
    }

    #[tokio::test]
    async fn test_hub_default() {
        let hub = Hub::default();
        assert_eq!(hub.client_count().await, 0);
    }
}
