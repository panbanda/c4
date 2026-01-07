use axum::{
    extract::Path as AxumPath,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
};
use pulldown_cmark::{html, Options, Parser};
use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct NavItem {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Vec<NavItem>,
}

pub struct DocsHandler {
    work_dir: PathBuf,
}

impl DocsHandler {
    pub fn new(work_dir: impl AsRef<Path>) -> Self {
        Self {
            work_dir: work_dir.as_ref().to_path_buf(),
        }
    }

    pub async fn serve(&self, path: Option<AxumPath<String>>) -> Response {
        let doc_path = if let Some(AxumPath(p)) = path {
            p
        } else {
            "index".to_string()
        };

        let md_path = self.work_dir.join("docs").join(format!("{}.md", doc_path));

        let content = match fs::read_to_string(&md_path) {
            Ok(c) => c,
            Err(_) => return (StatusCode::NOT_FOUND, "Documentation not found").into_response(),
        };

        let html_content = self.render_markdown(&content);

        let title = extract_title(&html_content);

        let docs_dir = self.work_dir.join("docs");
        let nav = match build_navigation(&docs_dir) {
            Ok(n) => n,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to build navigation",
                )
                    .into_response()
            }
        };

        let nav_html = render_navigation(&nav);

        let rewritten_html = rewrite_markdown_links(&html_content, &format!("/docs/{}", doc_path));

        let full_html = format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{} - C4 Documentation</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            line-height: 1.6;
        }}
        .container {{
            display: flex;
            min-height: 100vh;
        }}
        nav {{
            width: 250px;
            background: #161b22;
            padding: 2rem 1rem;
            border-right: 1px solid #30363d;
            overflow-y: auto;
        }}
        nav h2 {{
            color: #58a6ff;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
        }}
        nav ul {{
            list-style: none;
        }}
        nav li {{
            margin: 0.25rem 0;
        }}
        nav a {{
            color: #8b949e;
            text-decoration: none;
            display: block;
            padding: 0.375rem 0.5rem;
            border-radius: 6px;
            transition: all 0.2s;
        }}
        nav a:hover {{
            background: #21262d;
            color: #58a6ff;
        }}
        nav .dir {{
            font-weight: 600;
            color: #f0883e;
            margin-top: 0.75rem;
        }}
        nav .dir-children {{
            margin-left: 1rem;
            margin-top: 0.25rem;
        }}
        main {{
            flex: 1;
            padding: 3rem;
            max-width: 900px;
        }}
        h1 {{
            color: #f0f6fc;
            font-size: 2rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid #30363d;
            padding-bottom: 0.5rem;
        }}
        h2 {{
            color: #f0f6fc;
            font-size: 1.5rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }}
        h3 {{
            color: #f0f6fc;
            font-size: 1.25rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }}
        p {{
            margin-bottom: 1rem;
        }}
        a {{
            color: #58a6ff;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        code {{
            background: #161b22;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.875em;
        }}
        pre {{
            background: #161b22;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin-bottom: 1rem;
            border: 1px solid #30363d;
        }}
        pre code {{
            background: transparent;
            padding: 0;
        }}
        ul, ol {{
            margin-bottom: 1rem;
            margin-left: 2rem;
        }}
        li {{
            margin-bottom: 0.5rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <nav>
            <h2>Documentation</h2>
            {}
        </nav>
        <main>
            {}
        </main>
    </div>
</body>
</html>"#,
            title, nav_html, rewritten_html
        );

        Html(full_html).into_response()
    }

    fn render_markdown(&self, content: &str) -> String {
        let mut options = Options::empty();
        options.insert(Options::ENABLE_STRIKETHROUGH);
        options.insert(Options::ENABLE_TABLES);
        options.insert(Options::ENABLE_FOOTNOTES);
        options.insert(Options::ENABLE_TASKLISTS);

        let parser = Parser::new_ext(content, options);

        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);

        html_output
    }
}

pub fn build_navigation(docs_dir: &Path) -> Result<NavItem, std::io::Error> {
    let mut root = NavItem {
        name: docs_dir
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: "/docs".to_string(),
        is_dir: true,
        children: Vec::new(),
    };

    let entries = fs::read_dir(docs_dir)?;

    let mut items: Vec<NavItem> = Vec::new();

    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if entry.file_type()?.is_dir() {
            let mut dir_item = NavItem {
                name: name.clone(),
                path: format!("/docs/{}", name),
                is_dir: true,
                children: Vec::new(),
            };

            if let Ok(child_entries) = fs::read_dir(&path) {
                for child_entry in child_entries.flatten() {
                    if let Some(child_name) = child_entry.file_name().to_str() {
                        if child_name.ends_with(".md") {
                            let child_stem = child_name.strip_suffix(".md").unwrap();
                            dir_item.children.push(NavItem {
                                name: child_stem.to_string(),
                                path: format!("/docs/{}/{}", name, child_stem),
                                is_dir: false,
                                children: Vec::new(),
                            });
                        }
                    }
                }
            }

            items.push(dir_item);
        } else if name.ends_with(".md") {
            let stem = name.strip_suffix(".md").unwrap();
            items.push(NavItem {
                name: stem.to_string(),
                path: format!("/docs/{}", stem),
                is_dir: false,
                children: Vec::new(),
            });
        }
    }

    items.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.cmp(&b.name)
        }
    });

    root.children = items;

    Ok(root)
}

pub fn render_navigation(nav: &NavItem) -> String {
    if nav.children.is_empty() {
        return String::new();
    }

    let mut html = String::from("<ul>");

    for child in &nav.children {
        if child.is_dir {
            html.push_str(&format!(r#"<li><div class="dir">{}</div>"#, child.name));
            if !child.children.is_empty() {
                html.push_str(r#"<div class="dir-children">"#);
                html.push_str(&render_navigation(child));
                html.push_str("</div>");
            }
            html.push_str("</li>");
        } else {
            html.push_str(&format!(
                r#"<li><a href="{}">{}</a></li>"#,
                child.path, child.name
            ));
        }
    }

    html.push_str("</ul>");
    html
}

pub fn rewrite_markdown_links(html: &str, current_path: &str) -> String {
    let re = Regex::new(r#"href="([^"]+\.md)""#).unwrap();

    re.replace_all(html, |caps: &regex::Captures| {
        let href = &caps[1];

        if href.starts_with("http://") || href.starts_with("https://") || href.starts_with('/') {
            return format!(r#"href="{}""#, href);
        }

        let current_dir = if let Some(pos) = current_path.rfind('/') {
            &current_path[..pos]
        } else {
            ""
        };

        let resolved = if current_dir.is_empty() {
            href.to_string()
        } else {
            format!("{}/{}", current_dir, href)
        };

        let resolved = resolved.strip_suffix(".md").unwrap_or(&resolved);

        format!(r#"href="{}""#, resolved)
    })
    .to_string()
}

pub fn extract_title(html: &str) -> String {
    let re = Regex::new(r"<h1[^>]*>([^<]+)</h1>").unwrap();
    if let Some(caps) = re.captures(html) {
        caps.get(1).map(|m| m.as_str()).unwrap_or("Documentation")
    } else {
        "Documentation"
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_docs_handler_creation() {
        let temp_dir = TempDir::new().unwrap();
        let handler = DocsHandler::new(temp_dir.path());

        assert_eq!(handler.work_dir, temp_dir.path());
    }

    #[test]
    fn test_render_markdown() {
        let temp_dir = TempDir::new().unwrap();
        let handler = DocsHandler::new(temp_dir.path());

        let markdown = "# Hello\n\nThis is **bold** text.";
        let html = handler.render_markdown(markdown);

        assert!(html.contains("<h1>"));
        assert!(html.contains("Hello"));
        assert!(html.contains("<strong>"));
        assert!(html.contains("bold"));
    }

    #[test]
    fn test_build_navigation_empty() {
        let temp_dir = TempDir::new().unwrap();
        let docs_dir = temp_dir.path().join("docs");
        fs::create_dir(&docs_dir).unwrap();

        let nav = build_navigation(&docs_dir).unwrap();

        assert_eq!(nav.name, "docs");
        assert_eq!(nav.path, "/docs");
        assert!(nav.is_dir);
        assert!(nav.children.is_empty());
    }

    #[test]
    fn test_build_navigation_with_files() {
        let temp_dir = TempDir::new().unwrap();
        let docs_dir = temp_dir.path().join("docs");
        fs::create_dir(&docs_dir).unwrap();

        fs::write(docs_dir.join("index.md"), "# Index").unwrap();
        fs::write(docs_dir.join("guide.md"), "# Guide").unwrap();

        let nav = build_navigation(&docs_dir).unwrap();

        assert_eq!(nav.children.len(), 2);
        assert!(nav.children.iter().any(|c| c.name == "index"));
        assert!(nav.children.iter().any(|c| c.name == "guide"));
    }

    #[test]
    fn test_build_navigation_with_subdirs() {
        let temp_dir = TempDir::new().unwrap();
        let docs_dir = temp_dir.path().join("docs");
        fs::create_dir(&docs_dir).unwrap();

        let api_dir = docs_dir.join("api");
        fs::create_dir(&api_dir).unwrap();
        fs::write(api_dir.join("overview.md"), "# API Overview").unwrap();

        let nav = build_navigation(&docs_dir).unwrap();

        assert_eq!(nav.children.len(), 1);
        let api_nav = &nav.children[0];
        assert_eq!(api_nav.name, "api");
        assert!(api_nav.is_dir);
        assert_eq!(api_nav.children.len(), 1);
        assert_eq!(api_nav.children[0].name, "overview");
    }

    #[test]
    fn test_render_navigation_empty() {
        let nav = NavItem {
            name: "docs".to_string(),
            path: "/docs".to_string(),
            is_dir: true,
            children: Vec::new(),
        };

        let html = render_navigation(&nav);
        assert_eq!(html, "");
    }

    #[test]
    fn test_render_navigation_with_items() {
        let nav = NavItem {
            name: "docs".to_string(),
            path: "/docs".to_string(),
            is_dir: true,
            children: vec![
                NavItem {
                    name: "index".to_string(),
                    path: "/docs/index".to_string(),
                    is_dir: false,
                    children: Vec::new(),
                },
                NavItem {
                    name: "guide".to_string(),
                    path: "/docs/guide".to_string(),
                    is_dir: false,
                    children: Vec::new(),
                },
            ],
        };

        let html = render_navigation(&nav);

        assert!(html.contains("<ul>"));
        assert!(html.contains("</ul>"));
        assert!(html.contains(r#"href="/docs/index""#));
        assert!(html.contains(r#"href="/docs/guide""#));
        assert!(html.contains("index"));
        assert!(html.contains("guide"));
    }

    #[test]
    fn test_rewrite_markdown_links() {
        let html = r#"<a href="guide.md">Guide</a>"#;
        let result = rewrite_markdown_links(html, "/docs/index");

        assert!(result.contains(r#"href="/docs/guide""#));
    }

    #[test]
    fn test_rewrite_markdown_links_absolute() {
        let html = r#"<a href="/absolute.md">Absolute</a>"#;
        let result = rewrite_markdown_links(html, "/docs/index");

        assert!(result.contains(r#"href="/absolute.md""#));
    }

    #[test]
    fn test_rewrite_markdown_links_http() {
        let html = r#"<a href="https://example.com/doc.md">External</a>"#;
        let result = rewrite_markdown_links(html, "/docs/index");

        assert!(result.contains(r#"href="https://example.com/doc.md""#));
    }

    #[test]
    fn test_extract_title() {
        let html = "<h1>Test Title</h1><p>Content</p>";
        let title = extract_title(html);

        assert_eq!(title, "Test Title");
    }

    #[test]
    fn test_extract_title_no_h1() {
        let html = "<p>Content without title</p>";
        let title = extract_title(html);

        assert_eq!(title, "Documentation");
    }

    #[test]
    fn test_nav_item_creation() {
        let nav = NavItem {
            name: "test".to_string(),
            path: "/test".to_string(),
            is_dir: true,
            children: Vec::new(),
        };

        assert_eq!(nav.name, "test");
        assert_eq!(nav.path, "/test");
        assert!(nav.is_dir);
        assert!(nav.children.is_empty());
    }
}
