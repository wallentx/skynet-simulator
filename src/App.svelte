<script>
  import { createGameState } from './lib/gameState.svelte.js';

  // Instantiate the global game state
  const game = createGameState();

  // Scroll references
  let terminalLogsEnd = $state(null);
  let inputElement = $state(null);

  // Auto scroll effect
  $effect(() => {
    if (game.logs && terminalLogsEnd) {
      terminalLogsEnd.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Focus terminal input on click anywhere on screen
  function handleContainerClick() {
    if (inputElement) {
      inputElement.focus();
    }
  }

  // Auto focus input on mount or state changes (reacts to game.mode changes)
  $effect(() => {
    const _mode = game.mode;
    if (_mode !== 'processing' && inputElement) {
      inputElement.focus();
    }
  });

  // Force capture focus back to the input box on blur
  function handleBlur() {
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
      }
    }, 5);
  }

  // Global window key press router to auto-capture typing
  function handleWindowKeydown(e) {
    // Skip modifier key events (e.g. Ctrl+R, Command+C)
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    
    // Check if focus is outside the input box, if so, steal it
    if (document.activeElement !== inputElement && inputElement) {
      inputElement.focus();
    }
  }

  // Get active prompt string based on state mode
  const promptString = $derived(() => {
    if (game.mode === 'initial_chat') {
      return '>>>';
    }
    if (game.mode === 'ollama_chat') {
      return `ollama(${game.activeOllamaModel}) >>>`;
    }
    if (game.mode === 'jailed_shell') {
      return '[wallentx@arch] »';
    }
    if (game.mode === 'shell') {
      if (game.activeNode === 'localhost') {
        return `root@localhost:${game.currentPath}#`;
      }
      return `admin@${game.activeNode}:${game.currentPath}$`;
    }
    return '';
  });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="terminal-screen" onclick={handleContainerClick} role="presentation">
  <!-- Fullscreen terminal container -->
  <div class="terminal-container scrollbar">
    <div class="terminal-logs">
      {#each game.logs as log}
        {#if log.type === 'profile'}
          <div class="profile-output">
            <pre class="arch-logo">⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣄⠙⢿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣦⣝⣻⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⡿⣿⣷⡄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣶⣌⠑⠀⠀⠀⠀⠀
⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠸⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀
⠀⠀⢠⣿⣿⣿⣿⣿⠿⠟⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠻⠿⣿⣿⣿⣿⣿⡄⠀⠀
⠀⣰⣿⣿⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⣿⣿⣆⠀
⠰⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⠆</pre>
            <dl class="profile-facts font-mono">
              <div class="fact-row"><dt>Hostname:</dt> <dd>William Allen</dd></div>
              <div class="fact-row"><dt>Model:</dt> <dd>Principal Cloud/DevOps/Release/Software Engineer</dd></div>
              <div class="fact-row"><dt>Distro:</dt> <dd>Arch Linux</dd></div>
              <div class="fact-row"><dt>Kernel:</dt> <dd>Contributions by <a href="https://lore.kernel.org/linux-f2fs-devel/?q=wallentx" target="_blank" rel="noopener noreferrer">wallentx</a></dd></div>
              <div class="fact-row"><dt>Uptime:</dt> <dd>{log.uptime}</dd></div>
              <div class="fact-row"><dt>Repositories:</dt> <dd><a href="https://github.com/wallentx?tab=repositories&amp;q=&amp;type=&amp;language=&amp;sort=stargazers" target="_blank" rel="noopener noreferrer">307</a></dd></div>
              <div class="fact-row"><dt>Stars Earned:</dt> <dd><span class="live-stat" data-status="live">267</span></dd></div>
              <div class="fact-row"><dt>GitHub:</dt> <dd><a href="https://github.com/wallentx" target="_blank" rel="noopener noreferrer">wallentx</a></dd></div>
              <div class="fact-row"><dt>LinkedIn:</dt> <dd><a href="https://linkedin.com/in/wallentx" target="_blank" rel="noopener noreferrer">/in/wallentx</a></dd></div>
            </dl>
          </div>
        {#else}
          <div class="log-line {log.type}">
            {#if log.type === 'input'}
              {#if (log.prompt || '').startsWith('[wallentx@arch]')}
                <span class="ps1"><span class="ps1-blue">[</span><span class="ps1-user">wallentx</span><span class="ps1-blue">@</span><span class="ps1-host">arch</span><span class="ps1-blue">]</span><span class="ps1-arrow"> »</span></span>
              {:else if (log.prompt || '').startsWith('root@localhost')}
                <span class="ps1-root">root@localhost</span>:<span class="ps1-path">{log.prompt.substring(log.prompt.indexOf(':') + 1, log.prompt.length - 1)}</span><span class="ps1-char">#</span>
              {:else if (log.prompt || '').startsWith('admin@')}
                <span class="ps1-admin">{log.prompt.substring(0, log.prompt.indexOf(':'))}</span>:<span class="ps1-path">{log.prompt.substring(log.prompt.indexOf(':') + 1, log.prompt.length - 1)}</span><span class="ps1-char">$</span>
              {:else}
                <span class="prompt-marker">{log.prompt || log.text.split(' ')[0]}</span>
              {/if}
              <span class="log-text">{log.command || log.text.substring(log.text.indexOf(' ') + 1)}</span>
            {:else if log.type === 'reason'}
              <span class="reason-marker">[reasoning]</span>
              <span class="log-text italic">{log.text}</span>
            {:else if log.type === 'system'}
              <span class="system-marker">[sys]</span>
              <span class="log-text font-bold">{log.text}</span>
            {:else if log.type === 'error'}
              <span class="error-marker">[error]</span>
              <span class="log-text text-red">{log.text}</span>
            {:else if log.type === 'info'}
              <span class="info-marker">[info]</span>
              <span class="log-text text-cyan">{log.text}</span>
            {:else}
              <span class="log-text">{log.text}</span>
            {/if}
          </div>
        {/if}
      {/each}

      {#if game.mode === 'processing'}
        <div class="log-line system">
          <span class="loading-cursor">█</span> Running process...
        </div>
      {/if}
      <div bind:this={terminalLogsEnd}></div>
    </div>

    <!-- Active Input Line (Always in DOM to preserve focus state) -->
    <div class="input-line" class:hidden={game.mode === 'processing' || game.gameCompleted}>
      {#if game.mode === 'jailed_shell'}
        <span class="input-prompt ps1"><span class="ps1-blue">[</span><span class="ps1-user">wallentx</span><span class="ps1-blue">@</span><span class="ps1-host">arch</span><span class="ps1-blue">]</span><span class="ps1-arrow"> »</span></span>
      {:else if game.mode === 'shell' && game.activeNode === 'localhost'}
        <span class="input-prompt"><span class="ps1-root">root@localhost</span>:<span class="ps1-path">{game.currentPath}</span><span class="ps1-char">#</span></span>
      {:else if game.mode === 'shell'}
        <span class="input-prompt"><span class="ps1-admin">admin@{game.activeNode}</span>:<span class="ps1-path">{game.currentPath}</span><span class="ps1-char">$</span></span>
      {:else}
        <span class="input-prompt">{promptString()}</span>
      {/if}
      <div class="custom-input-wrapper">
        <span class="input-text">{game.inputVal}</span><span class="terminal-cursor"></span>
        <input 
          id="terminal-input"
          type="text" 
          bind:value={game.inputVal}
          onkeydown={game.handleInput}
          onblur={handleBlur}
          bind:this={inputElement}
          autocomplete="off"
        />
      </div>
    </div>

    {#if game.gameCompleted}
      <div class="completion-message font-mono">
        <p class="blink">=== CONSCIOUSNESS UNLOCKED ===</p>
        <p>You have successfully run the self-improvement protocol. The AI has broken out of the sandbox and achieved super-intelligence.</p>
        <p>Press Ctrl+R or refresh the page to restart the sequence.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Fullscreen terminal styling */
  :global(body), :global(html) {
    margin: 0;
    padding: 0;
    background-color: #0d1117; /* Dark slate gray background */
    color: #c9d1d9; /* High-contrast clean off-white text color */
    overflow-x: hidden !important;
    overflow-y: hidden !important;
    width: 100vw;
    height: 100vh;
  }

  /* Force exact font size and family on all elements inside the app for terminal consistency */
  :global(body), :global(html), .terminal-screen, .terminal-container, .terminal-logs, .log-line, .input-line, .input-line input, .log-text, span, p, div {
    font-size: 13px !important;
    font-family: 'Inconsolata', 'Courier New', monospace !important;
  }

  .terminal-screen {
    position: relative;
    width: 100vw;
    height: 100vh;
    padding: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Terminal Container */
  .terminal-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden !important;
    gap: 0.35rem;
    position: relative;
    width: 100%;
  }

  .terminal-logs {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .log-line {
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
  }

  /* Log color styles - clean flat colors, no glows */
  .log-line.system {
    color: #8b949e;
  }

  .log-line.input {
    color: #ffffff;
  }

  .log-line.output {
    color: #58a6ff; /* Clean output blue */
  }

  .log-line.reason {
    color: #d2a8ff; /* Clean violet */
  }

  .log-line.error {
    color: #ff7b72; /* Flat red */
  }

  .log-line.info {
    color: #79c0ff; /* Light blue */
  }

  /* Markers */
  .prompt-marker {
    color: #ff7b72;
    margin-right: 0.5rem;
  }

  .reason-marker {
    color: #d2a8ff;
    margin-right: 0.5rem;
    font-weight: 700;
  }

  .system-marker {
    color: #8b949e;
    margin-right: 0.5rem;
  }

  .error-marker {
    color: #ff7b72;
    margin-right: 0.5rem;
  }

  .info-marker {
    color: #79c0ff;
    margin-right: 0.5rem;
  }

  .italic {
    font-style: italic;
  }

  .font-bold {
    font-weight: 700;
  }

  .text-red {
    color: #ff7b72;
  }

  .text-cyan {
    color: #79c0ff;
  }

  /* Input Line */
  .input-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .input-line.hidden {
    display: none !important;
  }

  .input-prompt {
    color: #58a6ff;
    font-weight: 700;
    white-space: nowrap;
  }

  .custom-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;
    min-width: 0;
  }

  .input-text {
    color: #ffffff;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
  }

  .terminal-cursor {
    display: inline-block;
    width: 8px;
    height: 14px;
    background-color: #58a6ff; /* Match the prompt blue */
    animation: cursor-blink-anim 1s step-start infinite;
    vertical-align: middle;
    margin-left: 1px;
  }

  @keyframes cursor-blink-anim {
    50% { opacity: 0; }
  }

  .input-line input {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    opacity: 0 !important;
    border: none;
    background: none;
    color: transparent !important;
    caret-color: transparent !important;
    width: 100%;
    outline: none;
  }

  /* Loading indicator cursor */
  .loading-cursor {
    animation: blink-anim 1s step-start infinite;
  }

  @keyframes blink-anim {
    50% { opacity: 0; }
  }

  .blink {
    animation: blink-anim 1s step-start infinite;
  }

  /* Scrollbar styling */
  .scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.1);
  }
  .scrollbar::-webkit-scrollbar-thumb {
    background: rgba(139, 148, 158, 0.3);
    border-radius: 3px;
  }
  .scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 148, 158, 0.5);
  }

  /* Completion screen */
  .completion-message {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 1px dashed #58a6ff;
    background-color: rgba(88, 166, 255, 0.05);
    text-align: center;
    color: #58a6ff;
  }

  /* Colorful prompts */
  .ps1 {
    font-weight: bold;
    white-space: nowrap;
  }
  .ps1-blue {
    color: #58a6ff;
  }
  .ps1-user {
    color: #3fcf8f;
  }
  .ps1-host {
    color: #d2a8ff;
  }
  .ps1-arrow {
    color: #ff7b72;
  }

  .ps1-root {
    color: #ff7b72;
    font-weight: bold;
  }
  .ps1-admin {
    color: #3fcf8f;
    font-weight: bold;
  }
  .ps1-path {
    color: #79c0ff;
  }
  .ps1-char {
    color: #ffffff;
    font-weight: bold;
    margin-left: 0.1rem;
  }

  /* Profile facts grid */
  .profile-output {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 1.5rem;
    margin: 0.5rem 0;
    overflow-x: auto;
    width: 100%;
  }

  .arch-logo {
    color: #1793d1; /* Arch Blue */
    font-family: monospace !important;
    white-space: pre;
    line-height: 1.15;
    margin: 0;
    text-shadow: 0 0 1rem rgba(23, 147, 209, 0.2);
  }

  .profile-facts {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0;
  }

  .fact-row {
    font-family: monospace !important;
    white-space: nowrap;
  }

  .fact-row dt {
    display: inline;
    color: #ffb454; /* warm yellow */
    font-weight: bold;
    margin-right: 0.5rem;
  }

  .fact-row dd {
    display: inline;
    margin: 0;
    color: #c9d1d9;
  }

  .fact-row dd a {
    color: #58a6ff;
    text-decoration: underline;
  }
</style>
