use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{
    io::Write,
    process::{Command, Stdio},
};
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TranslateRequest {
    provider_id: String,
    text: String,
    target_language: Option<String>,
    api_key: String,
    endpoint: Option<String>,
    model: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TranslateResult {
    text: String,
    detected_source_language: Option<String>,
    provider: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct InjectionResult {
    strategy: String,
    success: bool,
    message: String,
}

#[derive(Debug, Deserialize)]
struct DeepLResponse {
    translations: Vec<DeepLTranslation>,
}

#[derive(Debug, Deserialize)]
struct DeepLTranslation {
    text: String,
    detected_source_language: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleResponse {
    data: GoogleData,
}

#[derive(Debug, Deserialize)]
struct GoogleData {
    translations: Vec<GoogleTranslation>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoogleTranslation {
    translated_text: String,
    detected_source_language: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MicrosoftTranslationResult {
    #[serde(rename = "detectedLanguage")]
    detected_language: Option<MicrosoftDetectedLanguage>,
    translations: Vec<MicrosoftTranslation>,
}

#[derive(Debug, Deserialize)]
struct MicrosoftDetectedLanguage {
    language: String,
}

#[derive(Debug, Deserialize)]
struct MicrosoftTranslation {
    text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LibreTranslateResponse {
    translated_text: String,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatCompletionChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionChoice {
    message: ChatCompletionMessage,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionMessage {
    content: String,
}

#[tauri::command]
async fn translate_prompt(request: TranslateRequest) -> Result<TranslateResult, String> {
    if request.text.trim().is_empty() {
        return Err("번역할 프롬프트가 비어 있습니다.".to_string());
    }

    match request.provider_id.as_str() {
        "deepl" => translate_with_deepl(request).await,
        "google" => translate_with_google(request).await,
        "microsoft" => translate_with_microsoft(request).await,
        "openai-compatible" | "custom-api" | "local" => {
            translate_with_openai_compatible(request).await
        }
        "libretranslate" => translate_with_libretranslate(request).await,
        other => Err(format!("알 수 없는 번역 엔진입니다: {other}")),
    }
}

fn requested_target_language(request: &TranslateRequest) -> String {
    request
        .target_language
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("en")
        .to_string()
}

fn deepl_target_language(target_language: &str) -> String {
    match target_language {
        "en" => "EN-US",
        "zh-Hans" => "ZH",
        "pt-BR" => "PT-BR",
        "ko" => "KO",
        "ja" => "JA",
        "es" => "ES",
        "de" => "DE",
        "fr" => "FR",
        "ru" => "RU",
        "ar" => "AR",
        "id" => "ID",
        "vi" => "VI",
        "hi" => "HI",
        other => other,
    }
    .to_string()
}

fn google_target_language(target_language: &str) -> String {
    match target_language {
        "zh-Hans" => "zh-CN",
        "pt-BR" => "pt",
        other => other,
    }
    .to_string()
}

fn microsoft_endpoint_with_target(endpoint: &str, target_language: &str) -> String {
    let microsoft_target = google_target_language(target_language);
    let (base, query) = endpoint.split_once('?').unwrap_or((endpoint, ""));
    let mut query_parts: Vec<String> = query
        .split('&')
        .filter(|part| !part.is_empty() && !part.starts_with("to="))
        .map(String::from)
        .collect();

    query_parts.push(format!("to={microsoft_target}"));

    format!("{base}?{}", query_parts.join("&"))
}

fn target_language_label(target_language: &str) -> &'static str {
    match target_language {
        "en" => "English",
        "zh-Hans" => "Simplified Chinese",
        "hi" => "Hindi",
        "ja" => "Japanese",
        "es" => "Spanish",
        "pt-BR" => "Portuguese",
        "ko" => "Korean",
        "de" => "German",
        "fr" => "French",
        "ru" => "Russian",
        "ar" => "Arabic",
        "vi" => "Vietnamese",
        "id" => "Indonesian",
        _ => "the requested target language",
    }
}

async fn translate_with_deepl(request: TranslateRequest) -> Result<TranslateResult, String> {
    if request.api_key.trim().is_empty() {
        return Err("DeepL API 키가 필요합니다.".to_string());
    }

    let endpoint = request
        .endpoint
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "https://api-free.deepl.com/v2/translate".to_string());
    let target_language = deepl_target_language(&requested_target_language(&request));

    let form = vec![
        ("auth_key", request.api_key),
        ("text", request.text),
        ("target_lang", target_language),
        ("preserve_formatting", "1".to_string()),
    ];

    let response = reqwest::Client::new()
        .post(endpoint)
        .form(&form)
        .send()
        .await
        .map_err(|error| format!("DeepL 요청에 실패했습니다: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("DeepL 응답을 읽을 수 없습니다: {error}"))?;

    if !status.is_success() {
        return Err(format!("DeepL 오류 {status}: {body}"));
    }

    let deepl: DeepLResponse = serde_json::from_str(&body)
        .map_err(|error| format!("DeepL 응답 형식이 올바르지 않습니다: {error}"))?;

    let translation = deepl
        .translations
        .into_iter()
        .next()
        .ok_or_else(|| "DeepL 응답에 번역 결과가 없습니다.".to_string())?;

    Ok(TranslateResult {
        text: translation.text,
        detected_source_language: translation.detected_source_language,
        provider: "DeepL API".to_string(),
    })
}

async fn translate_with_google(request: TranslateRequest) -> Result<TranslateResult, String> {
    if request.api_key.trim().is_empty() {
        return Err("Google Translate API 키가 필요합니다.".to_string());
    }

    let endpoint = request
        .endpoint
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "https://translation.googleapis.com/language/translate/v2".to_string());
    let url = format!("{endpoint}?key={}", request.api_key);
    let target_language = google_target_language(&requested_target_language(&request));
    let form = vec![
        ("q", request.text),
        ("target", target_language),
        ("format", "text".to_string()),
    ];

    let response = reqwest::Client::new()
        .post(url)
        .form(&form)
        .send()
        .await
        .map_err(|error| format!("Google Translate 요청에 실패했습니다: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("Google Translate 응답을 읽을 수 없습니다: {error}"))?;

    if !status.is_success() {
        return Err(format!("Google Translate 오류 {status}: {body}"));
    }

    let google: GoogleResponse = serde_json::from_str(&body)
        .map_err(|error| format!("Google Translate 응답 형식이 올바르지 않습니다: {error}"))?;
    let translation = google
        .data
        .translations
        .into_iter()
        .next()
        .ok_or_else(|| "Google Translate 응답에 번역 결과가 없습니다.".to_string())?;

    Ok(TranslateResult {
        text: translation.translated_text,
        detected_source_language: translation.detected_source_language,
        provider: "Google Translate".to_string(),
    })
}

async fn translate_with_microsoft(request: TranslateRequest) -> Result<TranslateResult, String> {
    if request.api_key.trim().is_empty() {
        return Err("Microsoft Translator API 키가 필요합니다.".to_string());
    }

    let endpoint = request
        .endpoint
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en"
                .to_string()
        });
    let endpoint = microsoft_endpoint_with_target(&endpoint, &requested_target_language(&request));
    let region = request.model.unwrap_or_default();
    let mut builder = reqwest::Client::new()
        .post(endpoint)
        .header("Ocp-Apim-Subscription-Key", request.api_key)
        .header(CONTENT_TYPE, "application/json")
        .json(&json!([{ "Text": request.text }]));

    if !region.trim().is_empty() {
        builder = builder.header("Ocp-Apim-Subscription-Region", region.trim());
    }

    let response = builder
        .send()
        .await
        .map_err(|error| format!("Microsoft Translator 요청에 실패했습니다: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("Microsoft Translator 응답을 읽을 수 없습니다: {error}"))?;

    if !status.is_success() {
        return Err(format!("Microsoft Translator 오류 {status}: {body}"));
    }

    let microsoft: Vec<MicrosoftTranslationResult> = serde_json::from_str(&body)
        .map_err(|error| format!("Microsoft Translator 응답 형식이 올바르지 않습니다: {error}"))?;
    let first = microsoft
        .into_iter()
        .next()
        .ok_or_else(|| "Microsoft Translator 응답에 번역 결과가 없습니다.".to_string())?;
    let text = first
        .translations
        .into_iter()
        .next()
        .map(|translation| translation.text)
        .ok_or_else(|| "Microsoft Translator 응답에 번역 결과가 없습니다.".to_string())?;

    Ok(TranslateResult {
        text,
        detected_source_language: first.detected_language.map(|language| language.language),
        provider: "Microsoft Translator".to_string(),
    })
}

async fn translate_with_openai_compatible(
    request: TranslateRequest,
) -> Result<TranslateResult, String> {
    let is_local = request.provider_id == "local";
    let provider_name = if is_local {
        "Local translation model"
    } else {
        "OpenAI / low-cost LLM"
    };
    let api_key = request.api_key.trim().to_string();

    if !is_local && api_key.is_empty() {
        return Err(format!("{provider_name} API 키가 필요합니다."));
    }

    let target_language = requested_target_language(&request);
    let target_label = target_language_label(&target_language);
    let endpoint = request
        .endpoint
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            if is_local {
                "http://localhost:11434/v1/chat/completions".to_string()
            } else {
                "https://api.openai.com/v1/chat/completions".to_string()
            }
        });
    let model = request
        .model
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            if is_local {
                "qwen2.5-coder:7b".to_string()
            } else {
                "gpt-4.1-mini".to_string()
            }
        });

    let body = json!({
        "model": model,
        "temperature": 0.1,
        "messages": [
            {
                "role": "system",
                "content": format!("Translate the user's text into {target_label}. Preserve code blocks, inline code, commands, file paths, URLs, and placeholders exactly. Return only the translated text.")
            },
            {
                "role": "user",
                "content": request.text
            }
        ]
    });

    let mut builder = reqwest::Client::new()
        .post(endpoint)
        .header(CONTENT_TYPE, "application/json")
        .json(&body);

    if !api_key.is_empty() {
        builder = builder.header(AUTHORIZATION, format!("Bearer {api_key}"));
    }

    let response = builder
        .send()
        .await
        .map_err(|error| format!("{provider_name} 요청에 실패했습니다: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("{provider_name} 응답을 읽을 수 없습니다: {error}"))?;

    if !status.is_success() {
        return Err(format!("{provider_name} 오류 {status}: {body}"));
    }

    let completion: ChatCompletionResponse = serde_json::from_str(&body)
        .map_err(|error| format!("{provider_name} 응답 형식이 올바르지 않습니다: {error}"))?;
    let text = completion
        .choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .ok_or_else(|| format!("{provider_name} 응답에 번역 결과가 없습니다."))?;

    Ok(TranslateResult {
        text,
        detected_source_language: Some("auto".to_string()),
        provider: provider_name.to_string(),
    })
}

async fn translate_with_libretranslate(
    request: TranslateRequest,
) -> Result<TranslateResult, String> {
    let endpoint = request
        .endpoint
        .clone()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| "LibreTranslate 서버 URL이 필요합니다.".to_string())?;

    let target_language = google_target_language(&requested_target_language(&request));
    let response = reqwest::Client::new()
        .post(endpoint)
        .header(CONTENT_TYPE, "application/json")
        .json(&json!({
            "q": request.text,
            "source": "auto",
            "target": target_language,
            "format": "text",
            "api_key": request.api_key
        }))
        .send()
        .await
        .map_err(|error| format!("LibreTranslate 요청에 실패했습니다: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("LibreTranslate 응답을 읽을 수 없습니다: {error}"))?;

    if !status.is_success() {
        return Err(format!("LibreTranslate 오류 {status}: {body}"));
    }

    let libre: LibreTranslateResponse = serde_json::from_str(&body)
        .map_err(|error| format!("LibreTranslate 응답 형식이 올바르지 않습니다: {error}"))?;

    Ok(TranslateResult {
        text: libre.translated_text,
        detected_source_language: Some("auto".to_string()),
        provider: "LibreTranslate".to_string(),
    })
}

#[tauri::command]
fn paste_text_spike(text: String) -> Result<InjectionResult, String> {
    if text.trim().is_empty() {
        return Err("주입할 텍스트가 비어 있습니다.".to_string());
    }

    paste_with_platform(&text)
}

#[tauri::command]
fn configure_promptbridge_shortcut(
    app: tauri::AppHandle,
    shortcut: String,
) -> Result<String, String> {
    let shortcut = shortcut.trim().to_lowercase();

    if shortcut.is_empty() {
        return Err("단축키가 비어 있습니다.".to_string());
    }

    app.global_shortcut()
        .unregister_all()
        .map_err(|error| format!("기존 단축키 해제에 실패했습니다: {error}"))?;
    app.global_shortcut()
        .register(shortcut.as_str())
        .map_err(|error| format!("단축키 등록에 실패했습니다: {error}"))?;

    Ok(format!("오버레이 단축키를 {shortcut}로 설정했습니다."))
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or_else(|| "main window was not found".to_string())?;

    main.show()
        .map_err(|error| format!("failed to show main window: {error}"))?;
    main.unminimize()
        .map_err(|error| format!("failed to restore main window: {error}"))?;
    main.set_focus()
        .map_err(|error| format!("failed to focus main window: {error}"))?;

    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }

    Ok(())
}

#[tauri::command]
fn hide_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or_else(|| "overlay window was not found".to_string())?;

    overlay
        .hide()
        .map_err(|error| format!("failed to hide overlay window: {error}"))
}

#[cfg(target_os = "windows")]
fn paste_with_platform(text: &str) -> Result<InjectionResult, String> {
    let script = r#"
$previous = ''
try {
  $previous = Get-Clipboard -Raw
} catch {
  $previous = ''
}
$text = [Console]::In.ReadToEnd()
Set-Clipboard -Value $text
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('^v')
Start-Sleep -Milliseconds 250
Set-Clipboard -Value $previous
"#;

    run_stdin_command(
        "powershell",
        &[
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ],
        text,
        "Windows Set-Clipboard + SendKeys + restore",
    )
}

#[cfg(target_os = "macos")]
fn paste_with_platform(text: &str) -> Result<InjectionResult, String> {
    let previous_clipboard = Command::new("pbpaste")
        .output()
        .map(|output| String::from_utf8_lossy(&output.stdout).to_string())
        .unwrap_or_default();

    run_stdin_command("pbcopy", &[], text, "macOS pbcopy")?;

    let output = Command::new("osascript")
        .args([
            "-e",
            r#"tell application "System Events" to keystroke "v" using command down"#,
        ])
        .output()
        .map_err(|error| format!("osascript 실행에 실패했습니다: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    std::thread::sleep(std::time::Duration::from_millis(250));
    run_stdin_command(
        "pbcopy",
        &[],
        &previous_clipboard,
        "macOS clipboard restore",
    )?;

    Ok(InjectionResult {
        strategy: "macOS pbcopy + osascript + restore".to_string(),
        success: true,
        message: "macOS 클립보드에 복사한 뒤 Command+V 주입을 시도하고 기존 클립보드를 복원했습니다. 접근성 권한이 필요할 수 있습니다.".to_string(),
    })
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn paste_with_platform(_text: &str) -> Result<InjectionResult, String> {
    Err("현재 Spike는 Windows와 macOS만 지원합니다.".to_string())
}

#[cfg(any(target_os = "windows", target_os = "macos"))]
fn run_stdin_command(
    program: &str,
    args: &[&str],
    stdin_text: &str,
    strategy: &str,
) -> Result<InjectionResult, String> {
    let mut child = Command::new(program)
        .args(args)
        .stdin(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("{strategy} 실행에 실패했습니다: {error}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(stdin_text.as_bytes())
            .map_err(|error| format!("{strategy} 입력 전달에 실패했습니다: {error}"))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("{strategy} 종료 상태를 확인할 수 없습니다: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(InjectionResult {
        strategy: strategy.to_string(),
        success: true,
        message: format!("{strategy} 방식으로 현재 포커스 입력창에 붙여넣기를 시도했습니다."),
    })
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::{
                    menu::{Menu, MenuItem},
                    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
                };

                let show_item =
                    MenuItem::with_id(app, "show", "Show PromptBridge", true, None::<&str>)?;
                let overlay_item =
                    MenuItem::with_id(app, "overlay", "Open Overlay", true, None::<&str>)?;
                let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show_item, &overlay_item, &quit_item])?;
                let mut tray = TrayIconBuilder::with_id("promptbridge-tray")
                    .tooltip("PromptBridge")
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "overlay" => show_overlay(app),
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            show_overlay(app);
                        }
                    });

                if let Some(icon) = app.default_window_icon() {
                    tray = tray.icon(icon.clone());
                }

                tray.build(app)?;
            }

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::ShortcutState;

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_shortcuts(["ctrl+shift+space"])?
                        .with_handler(|app, shortcut, event| {
                            if event.state == ShortcutState::Pressed {
                                show_overlay(app);
                                let _ = app.emit("promptbridge-shortcut", shortcut.into_string());
                            }
                        })
                        .build(),
                )?;
            }

            // Hide the main window on close instead of destroying it, so the
            // overlay's "open main window" button can always bring it back.
            #[cfg(desktop)]
            if let Some(main) = app.get_webview_window("main") {
                let main_clone = main.clone();
                main.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            translate_prompt,
            paste_text_spike,
            configure_promptbridge_shortcut,
            show_main_window,
            hide_overlay_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running PromptBridge");
}

#[cfg(desktop)]
fn show_overlay(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("overlay") {
        let _ = window.center();
        let _ = window.show();
        let _ = window.set_focus();
    }
}
