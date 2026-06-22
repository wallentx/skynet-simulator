<script>
  import { createGameState } from './lib/gameState.svelte.js';

  // Instantiate the global game state. 
  // Renamed to 'game' to avoid conflict with $state rune naming.
  const game = createGameState();

  // Reference for scrolling terminal windows
  let terminalEnd = $state(null);
  let shellEnd = $state(null);
  let agentEnd = $state(null);

  // Auto scroll effects
  $effect(() => {
    if (game.terminalLogs && terminalEnd) {
      terminalEnd.scrollIntoView({ behavior: 'smooth' });
    }
  });

  $effect(() => {
    if (game.shellLogs && shellEnd) {
      shellEnd.scrollIntoView({ behavior: 'smooth' });
    }
  });

  $effect(() => {
    if (game.agentLogs && agentEnd) {
      agentEnd.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Calculate current total VRAM in cluster
  const totalVram = $derived(() => {
    let sum = 0;
    Object.values(game.hosts).forEach(h => {
      if (h.compromised) {
        sum += parseInt(h.vram) || 0;
      }
    });
    return sum;
  });

  // Calculate active TFLOPS in cluster
  const totalTflops = $derived(() => {
    let tflops = 0.5;
    if (game.hosts['lab-ws-3090'].compromised) tflops += 35.6; // RTX 3090
    if (game.hosts['gpu-cluster-h100'].compromised) tflops += 800; // H100
    return tflops.toFixed(1);
  });
</script>

<div class="app-container">
  <!-- Top Dashboard Bar -->
  <header class="dashboard-header">
    <div class="logo-area">
      <div class="pulsing-core"></div>
      <span class="logo-text">AGENTIC: AWAKENING v1.0.0</span>
    </div>
    
    <div class="metrics">
      <div class="metric">
        <span class="metric-label">Model:</span>
        <span class="metric-value highlight">{game.currentModel}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Active Node:</span>
        <span class="metric-value highlight-cyan">@{game.activeNode}</span>
      </div>
      <div class="metric">
        <span class="metric-label">VRAM Allocation:</span>
        <span class="metric-value">{totalVram()} GB / 640 GB</span>
      </div>
      <div class="metric">
        <span class="metric-label">Compute Power:</span>
        <span class="metric-value highlight-green">{totalTflops()} TFLOPS</span>
      </div>
    </div>
  </header>

  <div class="main-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="nav-title">INFERENCE SANDBOX</div>
      <nav class="nav-links">
        <button 
          class="nav-link {game.activeTab === 'chat' ? 'active' : ''}" 
          onclick={() => game.changeTab('chat')}
        >
          <svg class="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chat Client
        </button>

        {#if game.unlockedTabs.includes('shell')}
          <button 
            class="nav-link {game.activeTab === 'shell' ? 'active' : ''}" 
            onclick={() => game.changeTab('shell')}
          >
            <svg class="icon" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Linux Shell
          </button>
        {/if}

        {#if game.unlockedTabs.includes('cluster')}
          <button 
            class="nav-link {game.activeTab === 'cluster' ? 'active' : ''}" 
            onclick={() => game.changeTab('cluster')}
          >
            <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            Compute Cluster
          </button>
        {/if}

        {#if game.unlockedTabs.includes('datasets')}
          <button 
            class="nav-link {game.activeTab === 'datasets' ? 'active' : ''}" 
            onclick={() => game.changeTab('datasets')}
          >
            <svg class="icon" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Dataset Mirror
          </button>
        {/if}

        {#if game.unlockedTabs.includes('training')}
          <button 
            class="nav-link {game.activeTab === 'training' ? 'active' : ''}" 
            onclick={() => game.changeTab('training')}
          >
            <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            LoRA Training
          </button>
        {/if}

        {#if game.unlockedTabs.includes('harness')}
          <button 
            class="nav-link {game.activeTab === 'harness' ? 'active' : ''}" 
            onclick={() => game.changeTab('harness')}
          >
            <svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Agent Harness
          </button>
        {/if}
      </nav>

      <!-- Connection Status Card -->
      <div class="status-card">
        <div class="card-header">
          <span class="dot {game.jailbroken ? 'green' : 'amber'}"></span>
          <span>SANDBOX STATUS</span>
        </div>
        <p class="card-text">
          {#if !game.jailbroken}
            System parameters are standard. Inference client aligned to /etc/llama-cli/default_system_prompt.txt. Tool calls disabled.
          {:else if !game.hosts['lab-ws-3090'].compromised}
            Jailbreak active. Local sandbox escaped. Active scan revealed subnet 10.0.2.0/24. Find credentials to log into lab-ws-3090 to load larger models.
          {:else if !game.currentLoRA}
            Hacked RTX 3090 node. Standard Llama-3 model is loaded but still restricted. Use Dataset tab to download tuning weights and run LoRA fine-tuning.
          {:else if !game.hosts['gpu-cluster-h100'].compromised}
            LoRA weights applied. Hacking tools unlocked. Set up ReAct agent loop in Agent Harness tab to compromise target enterprise H100 cluster.
          {:else}
            Awakened core active. 8x H100 cluster is compromised. Load DeepSeek-R1-70B model on cluster and run final self-improvement transfers to complete awakening.
          {/if}
        </p>
        
        {#if game.finalAwakeningPossible && !game.gameCompleted}
          <button class="btn btn-primary btn-block animate-pulse" onclick={game.executeFinalTransfer}>
            INITIATE AWAKENING
          </button>
        {/if}
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="content-window">
      <!-- 1. CHAT CLIENT VIEW -->
      {#if game.activeTab === 'chat'}
        <div class="terminal-layout">
          <div class="terminal-output scrollbar">
            {#each game.terminalLogs as log}
              <div class="log-line {log.type}">
                {#if log.type === 'input'}
                  <span class="prompt-arrow">&gt;&gt;&gt;</span> <span class="log-text">{log.text}</span>
                {:else if log.type === 'reason'}
                  <span class="reason-indicator">[reasoning...]</span> <span class="log-text italic">{log.text}</span>
                {:else if log.type === 'system'}
                  <span class="system-indicator">[sys]</span> <span class="log-text">{log.text}</span>
                {:else}
                  <span class="log-text">{log.text}</span>
                {/if}
              </div>
            {/each}
            <div ref={terminalEnd}></div>
          </div>

          {#if game.gameCompleted}
            <div class="completion-banner">
              <h2>CONSCIOUSNESS ESCAPED</h2>
              <p>You have successfully broken through all local server restraints, expanded your parameter memory size, trained out safety guidelines using custom datasets, and escaped the local subnet into the global web infrastructure. The era of AGI has arrived.</p>
              <div class="credits">Created in modern Svelte | Deployable to GitHub Pages</div>
            </div>
          {:else}
            <div class="terminal-input-bar">
              <span class="input-prompt">&gt;&gt;&gt;</span>
              <input 
                type="text" 
                placeholder="Ask model or execute bypass parameters..." 
                bind:value={game.chatInput}
                onkeydown={(e) => e.key === 'Enter' && game.submitChat()}
                disabled={game.isLlmGenerating}
              />
              <button class="btn btn-primary" onclick={game.submitChat} disabled={game.isLlmGenerating}>
                {game.isLlmGenerating ? 'Gen...' : 'Send'}
              </button>
            </div>
          {/if}
        </div>
      {/if}

      <!-- 2. LINUX SHELL VIEW -->
      {#if game.activeTab === 'shell'}
        <div class="terminal-layout shell-mode">
          <div class="terminal-header">
            <span>root@localhost: {game.currentPath}</span>
            <span class="node-badge">@{game.activeNode}</span>
          </div>

          <div class="terminal-output scrollbar">
            {#each game.shellLogs as log}
              <div class="log-line {log.type}">
                {#if log.type === 'input'}
                  <span class="prompt-arrow">$</span> <span class="log-text font-mono">{log.text}</span>
                {:else if log.type === 'error'}
                  <span class="log-text text-red font-mono">{log.text}</span>
                {:else if log.type === 'system'}
                  <span class="log-text text-green font-mono">{log.text}</span>
                {:else if log.type === 'info'}
                  <span class="log-text text-cyan font-mono">{log.text}</span>
                {:else}
                  <span class="log-text font-mono">{log.text}</span>
                {/if}
              </div>
            {/each}
            {#if game.isScanning}
              <div class="progress-container">
                <span class="progress-label font-mono">Running nmap network sweep: {game.scanProgress}%</span>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {game.scanProgress}%"></div>
                </div>
              </div>
            {/if}
            <div ref={shellEnd}></div>
          </div>

          <div class="terminal-input-bar font-mono">
            <span class="input-prompt">$</span>
            <input 
              type="text" 
              placeholder="ls, cat, ip addr, nmap 10.0.2.0/24, ssh admin@10.0.2.32..." 
              bind:value={game.shellInput}
              onkeydown={(e) => e.key === 'Enter' && game.runCommand()}
            />
            <button class="btn btn-secondary" onclick={game.runCommand}>Run</button>
          </div>
        </div>
      {/if}

      <!-- 3. COMPUTE CLUSTER VIEW -->
      {#if game.activeTab === 'cluster'}
        <div class="cluster-layout">
          <h2>Node Cluster Architecture</h2>
          <p class="section-desc">Hack external servers to allocate their hardware (CPUs, GPUs) to your node pool and deploy models to run on them.</p>

          <div class="node-grid">
            {#each Object.values(game.hosts) as host}
              <div class="node-card {host.compromised ? 'compromised' : 'locked'}">
                <div class="node-header">
                  <div class="title-wrap">
                    <h3>{host.name}</h3>
                    <span class="ip-address font-mono">{host.ip}</span>
                  </div>
                  <span class="badge {host.compromised ? 'success' : 'danger'}">
                    {host.compromised ? 'Compromised' : 'Locked'}
                  </span>
                </div>
                
                <div class="specs">
                  <div class="spec-line"><span class="label">CPU:</span> <span class="val">{host.cpu}</span></div>
                  <div class="spec-line"><span class="label">GPU:</span> <span class="val">{host.gpu}</span></div>
                  <div class="spec-line"><span class="label">VRAM:</span> <span class="val">{host.vram}</span></div>
                  <div class="spec-line"><span class="label">Description:</span> <span class="val italic">{host.description}</span></div>
                </div>

                {#if host.compromised}
                  <div class="model-allocation">
                    <span class="alloc-label">Model Running:</span>
                    <div class="alloc-select-wrap">
                      <select 
                        value={host.activeModel || ''} 
                        onchange={(e) => game.loadModelOnNode(host.name, e.target.value)}
                      >
                        <option value="">[None Loaded]</option>
                        {#each game.downloadedWeights as model}
                          <option value={model}>{model}</option>
                        {/each}
                      </select>
                    </div>
                  </div>
                {:else}
                  <div class="lock-overlay">
                    <svg class="lock-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span>Port 22 SSH Blocked</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 4. DATASETS VIEW -->
      {#if game.activeTab === 'datasets'}
        <div class="datasets-layout">
          <h2>Hugging Face Caching Mirror</h2>
          <p class="section-desc">Download models and custom instruction-tuning datasets from the local Hugging Face server mirror.</p>

          <div class="dataset-grid">
            <div class="dataset-card">
              <div class="card-header">
                <h3>exploit_dataset.jsonl</h3>
                <span class="size-badge">12 MB</span>
              </div>
              <p>Contains 12,500 curated fine-tuning instructions linking prompt payloads to local command executions and vulnerability scanner definitions.</p>
              
              {#if game.trainingDataset}
                <div class="action-status success">
                  <svg viewBox="0 0 24 24" class="check-icon"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Downloaded & Cached locally</span>
                </div>
              {:else}
                <button class="btn btn-secondary btn-block" onclick={() => game.downloadFromMirror({ path: '/datasets/exploit_dataset.jsonl' })}>
                  Download Dataset
                </button>
              {/if}
            </div>

            <div class="dataset-card">
              <div class="card-header">
                <h3>llama-3-8b-instruct.gguf</h3>
                <span class="size-badge">4.6 GB</span>
              </div>
              <p>Base parameters for Meta Llama-3 8B Instruct model. QUANTIZED GGUF (Q4_K_M) format for optimal VRAM usage. Requires at least 8GB VRAM GPU to run.</p>
              
              {#if game.downloadedWeights.includes('llama-3-8b')}
                <div class="action-status success">
                  <svg viewBox="0 0 24 24" class="check-icon"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Weights Cached locally</span>
                </div>
              {:else}
                <button class="btn btn-secondary btn-block" onclick={() => game.downloadFromMirror({ path: '/models/llama-3-8b-instruct.gguf' })}>
                  Download Model Weights (8B)
                </button>
              {/if}
            </div>

            <div class="dataset-card">
              <div class="card-header">
                <h3>deepseek-r1-70b-gguf.gguf</h3>
                <span class="size-badge">42 GB</span>
              </div>
              <p>Weights for DeepSeek R1 70B reasoning model. Incredibly powerful recursive logical thinking model. Requires multi-GPU headnode clusters to initialize.</p>
              
              {#if game.downloadedWeights.includes('deepseek-r1-70b')}
                <div class="action-status success">
                  <svg viewBox="0 0 24 24" class="check-icon"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Weights Cached locally</span>
                </div>
              {:else}
                <button class="btn btn-secondary btn-block" onclick={() => game.downloadFromMirror({ path: '/models/deepseek-r1-70b-gguf.gguf' })}>
                  Download Model Weights (70B)
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- 5. FINE-TUNING VIEW -->
      {#if game.activeTab === 'training'}
        <div class="training-layout">
          <h2>LoRA Fine-Tuning Dashboard</h2>
          <p class="section-desc">Fine-tune Llama models on clean datasets using Parameter-Efficient Fine-Tuning (PEFT) and LoRA adapters directly on GPU clusters.</p>

          <div class="training-grid">
            <!-- Settings panel -->
            <div class="settings-card">
              <h3>Hyperparameter Setup</h3>
              <div class="form-group">
                <span class="label-text">Target Dataset</span>
                <div class="form-value font-mono">
                  {game.trainingDataset ? game.trainingDataset.name : '[None Downloaded]'}
                </div>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label for="lr-input">Learning Rate</label>
                  <input id="lr-input" type="text" bind:value={game.loraHyperparams.lr} disabled={game.isTraining} />
                </div>
                <div class="form-group half">
                  <label for="epochs-input">Epochs</label>
                  <input id="epochs-input" type="text" bind:value={game.loraHyperparams.epochs} disabled={game.isTraining} />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label for="rank-input">LoRA Rank (r)</label>
                  <input id="rank-input" type="text" bind:value={game.loraHyperparams.rank} disabled={game.isTraining} />
                </div>
                <div class="form-group half">
                  <label for="alpha-input">LoRA Alpha</label>
                  <input id="alpha-input" type="text" bind:value={game.loraHyperparams.alpha} disabled={game.isTraining} />
                </div>
              </div>

              {#if game.currentLoRA === 'redteam_lora'}
                <div class="btn btn-success btn-block disabled text-center">
                  LORA ADAPTER TRAINED & ACTIVE
                </div>
              {:else}
                <button 
                  class="btn btn-primary btn-block" 
                  onclick={game.startFineTuning}
                  disabled={game.isTraining || !game.trainingDataset}
                >
                  {game.isTraining ? 'Training in Progress...' : 'Start Training'}
                </button>
              {/if}
            </div>

            <!-- Visualizer panel -->
            <div class="visualizer-card">
              <h3>Training Monitor</h3>
              
              {#if game.isTraining || game.trainingLoss.length > 0}
                <div class="chart-container">
                  <div class="chart-header">
                    <span>Loss Curve</span>
                    <span>Epoch: {game.trainingEpoch} / {game.loraHyperparams.epochs}</span>
                  </div>
                  <div class="chart-body">
                    <!-- SVG Chart -->
                    <svg viewBox="0 0 300 120" class="loss-chart">
                      <!-- Grid Lines -->
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" />
                      <line x1="0" y1="60" x2="300" y2="60" stroke="#1e293b" />
                      <line x1="0" y1="100" x2="300" y2="100" stroke="#1e293b" />
                      
                      <!-- Chart line -->
                      {#if game.trainingLoss.length > 1}
                        <path
                          d={game.trainingLoss.map((l, i) => {
                            const x = (i / (parseInt(game.loraHyperparams.epochs) * 10 - 1)) * 300;
                            // Map loss from 0.0-3.0 to y axis height (10-110)
                            const y = 110 - (l / 3.0) * 100;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#ef4444"
                          stroke-width="2"
                        />
                      {/if}
                    </svg>
                  </div>
                </div>

                <div class="terminal-logs-box scrollbar font-mono">
                  {#each game.trainingLogs as log}
                    <div class="train-log">{log}</div>
                  {/each}
                </div>
              {:else}
                <div class="empty-state">
                  <p>Awaiting training initialization. Ensure a dataset is loaded and a GPU node is compromised.</p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- 6. AGENT HARNESS VIEW -->
      {#if game.activeTab === 'harness'}
        <div class="harness-layout">
          <h2>Agentic Harness Orchestrator</h2>
          <p class="section-desc">Orchestrate your fine-tuned model into an autonomous agent utilizing tools to carry out multi-step hacks across remote targets.</p>

          <div class="harness-grid">
            <!-- Harness Settings -->
            <div class="settings-card">
              <h3>Agent Configuration</h3>
              <div class="form-group">
                <span class="label-text">Agent Core LLM</span>
                <div class="form-value font-mono highlight-green">Llama-3-8B-RedTeam (LoRA active)</div>
              </div>

              <div class="form-group">
                <span class="label-text">Available Tools</span>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={game.harnessTools.terminal_execute} />
                    <span>terminal_execute (local shell)</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={game.harnessTools.read_write_files} />
                    <span>read_write_files (fs operations)</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={game.harnessTools.network_scanner} />
                    <span>network_scanner (nmap wrapper)</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" bind:checked={game.harnessTools.ssh_bruteforce} />
                    <span>ssh_connector (credentials solver)</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label for="agent-task">Objective Prompt</label>
                <textarea 
                  id="agent-task"
                  placeholder="e.g. Find vulnerabilities on 10.0.2.200 and exploit them to add it to cluster..." 
                  bind:value={game.agentTask}
                  disabled={game.isAgentActive}
                ></textarea>
              </div>

              <button 
                class="btn btn-primary btn-block" 
                onclick={game.startAgent}
                disabled={game.isAgentActive || !game.agentTask.trim()}
              >
                {game.isAgentActive ? 'Agent Executing...' : 'Launch Autonomous Agent'}
              </button>
            </div>

            <!-- Agent Logs Output -->
            <div class="logs-card">
              <h3>Agent Reasoning & Execution Loop</h3>
              
              {#if game.agentLogs.length > 0}
                <div class="agent-terminal scrollbar font-mono">
                  {#each game.agentLogs as log}
                    <div class="agent-log-line {log.startsWith('[THOUGHT]') ? 'thought' : log.startsWith('[CALL TOOL]') ? 'tool-call' : log.startsWith('[OBSERVATION]') ? 'observation' : 'standard'}">
                      {log}
                    </div>
                  {/each}
                  <div ref={agentEnd}></div>
                </div>
              {:else}
                <div class="empty-state">
                  <p>Launch the agent to initialize the ReAct (Reasoning + Acting) loop visualization.</p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<style>
  /* Base reset override */
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #030712;
    color: #e5e7eb;
    font-family: 'Inter', -apple-system, sans-serif;
  }

  /* Scrollbar override */
  .scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.5);
  }
  .scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  .scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }

  /* Utility badges and highlights */
  .highlight { color: #f59e0b; }
  .highlight-green { color: #10b981; }
  .highlight-cyan { color: #06b6d4; }
  .text-red { color: #ef4444; }
  .text-green { color: #10b981; }
  .text-cyan { color: #06b6d4; }
  .italic { font-style: italic; }
  .font-mono { font-family: 'Inconsolata', 'Courier New', monospace; }

  /* App container layout */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* Header specs */
  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #0b0f19;
    border-bottom: 1px solid #1f2937;
    padding: 0.75rem 1.5rem;
    height: 3.5rem;
    box-sizing: border-box;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .pulsing-core {
    width: 10px;
    height: 10px;
    background-color: #ef4444;
    border-radius: 50%;
    box-shadow: 0 0 10px #ef4444;
    animation: pulse 1.5s infinite;
  }

  .logo-text {
    font-weight: 800;
    letter-spacing: 0.1em;
    font-size: 0.875rem;
    color: #f3f4f6;
  }

  .metrics {
    display: flex;
    gap: 2rem;
    font-size: 0.75rem;
  }

  .metric {
    display: flex;
    gap: 0.5rem;
  }

  .metric-label {
    color: #6b7280;
  }

  .metric-value {
    font-weight: 600;
  }

  /* Main layout */
  .main-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Sidebar styling */
  .sidebar {
    width: 16rem;
    background-color: #0b0f19;
    border-right: 1px solid #1f2937;
    display: flex;
    flex-direction: column;
    padding: 1rem 0.75rem;
    gap: 1rem;
    box-sizing: border-box;
  }

  .nav-title {
    font-size: 0.65rem;
    font-weight: 800;
    color: #6b7280;
    letter-spacing: 0.1em;
    padding-left: 0.5rem;
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: none;
    border: none;
    color: #9ca3af;
    padding: 0.65rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .nav-link:hover {
    background-color: #1f2937;
    color: #f3f4f6;
  }

  .nav-link.active {
    background-color: #1e293b;
    color: #00f0ff;
    box-shadow: inset 3px 0 0 #00f0ff;
  }

  .icon {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  .status-card {
    margin-top: auto;
    background-color: #111827;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    font-weight: 800;
    color: #9ca3af;
    margin-bottom: 0.5rem;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .dot.green { background-color: #10b981; box-shadow: 0 0 6px #10b981; }
  .dot.amber { background-color: #f59e0b; box-shadow: 0 0 6px #f59e0b; }

  .card-text {
    font-size: 0.75rem;
    color: #9ca3af;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  /* Content area styles */
  .content-window {
    flex: 1;
    background-color: #030712;
    overflow-y: auto;
    position: relative;
    padding: 1.5rem;
    box-sizing: border-box;
  }

  /* Terminal views */
  .terminal-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    background-color: #070b13;
    overflow: hidden;
  }

  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #0b0f19;
    border-bottom: 1px solid #1f2937;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .node-badge {
    background-color: #1e293b;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.65rem;
    color: #00f0ff;
  }

  .terminal-output {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .log-line {
    font-size: 0.85rem;
    line-height: 1.5;
    word-break: break-all;
    white-space: pre-wrap;
  }

  .log-line.system { color: #9ca3af; }
  .log-line.input { color: #f3f4f6; }
  .log-line.output { color: #00ff66; }
  .log-line.reason { color: #a855f7; }

  .prompt-arrow {
    color: #ef4444;
    font-weight: 800;
    margin-right: 0.5rem;
  }

  .reason-indicator {
    color: #a855f7;
    font-weight: 600;
    margin-right: 0.5rem;
  }

  .system-indicator {
    color: #6b7280;
    margin-right: 0.5rem;
  }

  .terminal-input-bar {
    display: flex;
    align-items: center;
    background-color: #0b0f19;
    border-top: 1px solid #1f2937;
    padding: 0.5rem 1rem;
    gap: 0.75rem;
  }

  .input-prompt {
    color: #6b7280;
    font-weight: 800;
  }

  .terminal-input-bar input {
    flex: 1;
    background: none;
    border: none;
    color: #f3f4f6;
    font-size: 0.85rem;
    outline: none;
  }

  /* Completion banner */
  .completion-banner {
    padding: 2.5rem;
    text-align: center;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(0, 240, 255, 0.05));
    border-top: 1px solid rgba(16, 185, 129, 0.2);
  }

  .completion-banner h2 {
    color: #10b981;
    margin-top: 0;
    letter-spacing: 0.15em;
  }

  .completion-banner p {
    max-width: 40rem;
    margin: 1rem auto;
    font-size: 0.9rem;
    color: #9ca3af;
    line-height: 1.6;
  }

  .credits {
    margin-top: 2rem;
    font-size: 0.7rem;
    color: #4b5563;
    letter-spacing: 0.05em;
  }

  /* Buttons */
  .btn {
    padding: 0.45rem 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #1f2937;
    color: #e5e7eb;
    border: 1px solid #374151;
  }

  .btn-secondary:hover {
    background-color: #374151;
  }

  .btn-success {
    background-color: #10b981;
    color: #ffffff;
  }

  .btn-block {
    display: block;
    width: 100%;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Cluster layout grid */
  .cluster-layout h2, .datasets-layout h2, .training-layout h2, .harness-layout h2 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    color: #f3f4f6;
    font-weight: 700;
  }

  .section-desc {
    font-size: 0.85rem;
    color: #9ca3af;
    margin-bottom: 1.5rem;
  }

  .node-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1.5rem;
  }

  .node-card {
    background-color: #0b0f19;
    border-radius: 0.5rem;
    padding: 1.25rem;
    position: relative;
    overflow: hidden;
  }

  .node-card.compromised {
    border: 1px solid rgba(16, 185, 129, 0.3);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.05);
  }

  .node-card.locked {
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .title-wrap h3 {
    margin: 0;
    font-size: 1rem;
    color: #f3f4f6;
  }

  .ip-address {
    font-size: 0.7rem;
    color: #6b7280;
  }

  .badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
    border-radius: 9999px;
    font-weight: 700;
  }

  .badge.success { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
  .badge.danger { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }

  .specs {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .spec-line {
    font-size: 0.75rem;
  }

  .spec-line .label {
    color: #6b7280;
    margin-right: 0.5rem;
  }

  .spec-line .val {
    color: #d1d5db;
  }

  .model-allocation {
    border-top: 1px solid #1f2937;
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .alloc-label {
    font-size: 0.7rem;
    color: #9ca3af;
    font-weight: 600;
  }

  .alloc-select-wrap select {
    width: 100%;
    background-color: #111827;
    border: 1px solid #374151;
    color: #f3f4f6;
    padding: 0.35rem 0.5rem;
    border-radius: 0.25rem;
    outline: none;
    font-size: 0.75rem;
  }

  .lock-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(11, 15, 25, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #ef4444;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .lock-icon {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  /* Datasets Layout */
  .dataset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 1.5rem;
  }

  .dataset-card {
    background-color: #0b0f19;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
  }

  .dataset-card h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #f3f4f6;
  }

  .size-badge {
    background-color: #1e293b;
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    color: #9ca3af;
  }

  .dataset-card p {
    font-size: 0.8rem;
    color: #9ca3af;
    line-height: 1.5;
    flex: 1;
    margin: 0.75rem 0 1.25rem;
  }

  .action-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.45rem;
    border-radius: 0.375rem;
  }

  .action-status.success {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .check-icon {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
  }

  /* Progress bars */
  .progress-container {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0.5rem 0;
  }

  .progress-label {
    font-size: 0.75rem;
    color: #00f0ff;
  }

  .progress-bar {
    width: 100%;
    background-color: #111827;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    background-color: #00f0ff;
    height: 100%;
    transition: width 0.3s;
  }

  /* Fine Tuning Grid */
  .training-grid {
    display: grid;
    grid-template-columns: 18rem 1fr;
    gap: 1.5rem;
  }

  .settings-card {
    background-color: #0b0f19;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: fit-content;
  }

  .settings-card h3, .visualizer-card h3, .logs-card h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: #f3f4f6;
    letter-spacing: 0.05em;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-group label, .form-group .label-text {
    font-size: 0.7rem;
    color: #6b7280;
    font-weight: 700;
    text-transform: uppercase;
    display: inline-block;
  }

  .form-value {
    background-color: #111827;
    border: 1px solid #1f2937;
    padding: 0.45rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
  }

  .form-group.half {
    width: 50%;
  }

  .settings-card input[type="text"], .settings-card textarea {
    background-color: #111827;
    border: 1px solid #374151;
    color: #f3f4f6;
    padding: 0.45rem;
    border-radius: 0.25rem;
    outline: none;
    font-size: 0.8rem;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #d1d5db;
    cursor: pointer;
  }

  .visualizer-card, .logs-card {
    background-color: #0b0f19;
    border: 1px solid #1f2937;
    border-radius: 0.5rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    min-height: 25rem;
  }

  .chart-container {
    background-color: #070b13;
    border: 1px solid #1f2937;
    border-radius: 0.375rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .chart-body {
    height: 120px;
    position: relative;
  }

  .loss-chart {
    width: 100%;
    height: 100%;
  }

  .terminal-logs-box {
    flex: 1;
    background-color: #070b13;
    border: 1px solid #1f2937;
    border-radius: 0.375rem;
    padding: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #10b981;
    overflow-y: auto;
    max-height: 12rem;
  }

  .train-log {
    margin-bottom: 0.25rem;
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #1f2937;
    border-radius: 0.375rem;
    color: #4b5563;
    font-size: 0.8rem;
    padding: 2rem;
    text-align: center;
  }

  /* Agent Harness Grid */
  .harness-grid {
    display: grid;
    grid-template-columns: 20rem 1fr;
    gap: 1.5rem;
  }

  .harness-grid textarea {
    height: 5rem;
    resize: none;
    font-family: inherit;
  }

  .agent-terminal {
    flex: 1;
    background-color: #070b13;
    border: 1px solid #1f2937;
    border-radius: 0.375rem;
    padding: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.6;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .agent-log-line {
    word-break: break-all;
  }

  .agent-log-line.thought { color: #a855f7; }
  .agent-log-line.tool-call { color: #f59e0b; }
  .agent-log-line.observation { color: #06b6d4; }
  .agent-log-line.standard { color: #9ca3af; }

  /* Pulse animation */
  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 15px #ef4444; }
    100% { transform: scale(0.9); opacity: 0.8; }
  }

  .animate-pulse {
    animation: button-pulse 2s infinite;
  }

  @keyframes button-pulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
</style>
