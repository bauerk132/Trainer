import { TrainingConfig, NotebookCell } from '../types/notebook';

export function generateNotebookCells(config: TrainingConfig): NotebookCell[] {
  const isUnsloth = config.framework === 'unsloth';
  
  return [
    {
      id: 'cell_01_intro',
      cell_type: 'markdown',
      title: '01. Gemma E4B 4-Bit QLoRA Fine-Tuning on OpenHermes-2.5',
      description: 'End-to-End Supervised Fine-Tuning Pipeline for Gemma 4-Bit Quantized on OpenHermes',
      source: [
        `# Fine-Tuning Gemma E4B (4-Bit Quantized) on OpenHermes-2.5 with TRL / SFTTrainer\n`,
        `\n`,
        `This Google Colab notebook provides an end-to-end, production-grade supervised fine-tuning pipeline for **${config.modelName}** (\`${config.modelId}\`) using **4-bit NF4 Quantization (BitsAndBytes)** and **QLoRA** on the premier conversational dataset **\`${config.datasetName}\`**.\n`,
        `\n`,
        `### Architecture & Pipeline Highlights:\n`,
        `- **Target Model**: \`${config.modelId}\` loaded in **4-bit NF4 quantization** with double quantization\n`,
        `- **Parameter Efficient Fine-Tuning (PEFT)**: QLoRA with Rank $r=${config.loraRank}$, Alpha $\\alpha=${config.loraAlpha}$, Dropout ${config.loraDropout}\n`,
        `- **Dataset Preprocessing**: Loads \`${config.datasetName}\` using Hugging Face \`datasets\`, formats ShareGPT conversation trees into Gemma's official chat template (\`<start_of_turn>user...<end_of_turn>\`), tokenizes with padding/truncation, and builds a dedicated **train/validation split**\n`,
        `- **Training Loop**: Configured with \`trl.SFTTrainer\` and \`transformers.TrainingArguments\` (LR=${config.learningRate}, Batch Size=${config.batchSize}, Gradient Accum=${config.gradientAccumulation}, Epochs=${config.epochs})\n`,
        `- **Evaluation & Metrics**: Computes cross-entropy validation loss and exact **Perplexity ($PPL = e^{\\mathcal{L}_{\\text{val}}}$)** on held-out validation samples\n`,
        `- **Checkpoint Persistence**: Saves fine-tuned LoRA checkpoints to **Google Drive** (\`/content/drive/MyDrive/...\`) and pushes directly to the **Hugging Face Hub**\n`
      ],
      execution_count: null
    },
    {
      id: 'cell_02_install',
      cell_type: 'code',
      title: '02. Environment & Dependency Installation',
      description: 'Installs Transformers, Datasets, TRL, PEFT, BitsAndBytes, and Accelerate',
      source: [
        `# Install Hugging Face ML fine-tuning stack with 4-bit CUDA support\n`,
        isUnsloth
          ? `# Fast Unsloth Kernels + TRL + PEFT\n!pip install -q --upgrade --no-cache-dir "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"\n!pip install -q --no-deps trl peft accelerate bitsandbytes datasets transformers\n`
          : `# Standard Hugging Face TRL + PEFT + BitsAndBytes\n!pip install -q --upgrade transformers datasets trl peft bitsandbytes accelerate\n`,
        `\n`,
        `# Install auxiliary packages for evaluation, plotting, and Drive integration\n`,
        `!pip install -q scipy matplotlib ipywidgets evaluate\n`,
        `print("ML libraries and dependencies installed successfully.")`
      ],
      execution_count: 1
    },
    {
      id: 'cell_03_hardware',
      cell_type: 'code',
      title: '03. Hardware Diagnostics & CUDA Verification',
      description: 'Verifies GPU memory, CUDA compute capability, and float precision',
      source: [
        `import torch\n`,
        `import os\n`,
        `\n`,
        `print(f"PyTorch Version: {torch.__version__}")\n`,
        `print(f"CUDA Available:  {torch.cuda.is_available()}")\n`,
        `\n`,
        `if torch.cuda.is_available():\n`,
        `    gpu_name = torch.cuda.get_device_name(0)\n`,
        `    total_mem = torch.cuda.get_device_properties(0).total_memory / (1024**3)\n`,
        `    compute_cap = torch.cuda.get_device_capability(0)\n`,
        `    bf16_ready = torch.cuda.is_bf16_supported()\n`,
        `    \n`,
        `    print(f"Assigned GPU:    {gpu_name}")\n`,
        `    print(f"Total VRAM:      {total_mem:.2f} GB")\n`,
        `    print(f"Compute Cap:     {compute_cap[0]}.{compute_cap[1]}")\n`,
        `    print(f"BF16 Precision:  {'Enabled (Ampere/Ada/Hopper)' if bf16_ready else 'Using FP16 (Standard T4)'}")\n`,
        `else:\n`,
        `    raise SystemError("CRITICAL: No GPU found. Go to 'Runtime' -> 'Change runtime type' -> Select 'T4 GPU' or 'A100'.")`
      ],
      execution_count: 2
    },
    {
      id: 'cell_04_auth_drive',
      cell_type: 'code',
      title: '04. Google Drive Mount & Hugging Face Hub Authentication',
      description: 'Mounts Google Drive for persistent checkpoint storage and logs into Hugging Face Hub',
      source: [
        `# Part A: Mount Google Drive for resilient checkpoint persistence\n`,
        `from google.colab import drive\n`,
        `import os\n`,
        `\n`,
        `try:\n`,
        `    drive.mount('/content/drive')\n`,
        `    drive_save_path = "/content/drive/MyDrive/gemma_e4b_openhermes_checkpoints"\n`,
        `    os.makedirs(drive_save_path, exist_ok=True)\n`,
        `    print(f"Google Drive mounted. Checkpoints will be backed up to: {drive_save_path}")\n`,
        `except Exception as e:\n`,
        `    print(f"Drive mount notice: {e}. Falling back to local Colab ephemeral storage.")\n`,
        `    drive_save_path = "./checkpoints_local"\n`,
        `    os.makedirs(drive_save_path, exist_ok=True)\n`,
        `\n`,
        `# Part B: Hugging Face Authentication (needed to download Gemma weights and push models)\n`,
        `from huggingface_hub import login\n`,
        `\n`,
        `try:\n`,
        `    from google.colab import userdata\n`,
        `    hf_token = userdata.get('HF_TOKEN')\n`,
        `    login(token=hf_token)\n`,
        `    print("Authenticated with Hugging Face Hub using Colab Secrets.")\n`,
        `except Exception:\n`,
        `    print("Colab Secret 'HF_TOKEN' not set. Opening interactive login widget:")\n`,
        `    login()\n`
      ],
      execution_count: 3
    },
    {
      id: 'cell_05_load_model',
      cell_type: 'code',
      title: '05. Correctly Load Gemma E4B in 4-Bit Quantization (NF4)',
      description: 'Loads the quantized Gemma base model with BitsAndBytes 4-bit configuration',
      source: isUnsloth ? [
        `from unsloth import FastLanguageModel\n`,
        `import torch\n`,
        `\n`,
        `max_seq_length = ${config.maxSeqLength}\n`,
        `dtype = None  # Auto detection (float16 on T4, bfloat16 on L4/A100)\n`,
        `load_in_4bit = True  # Enforce 4-bit QLoRA\n`,
        `\n`,
        `print(f"Loading '{config.modelId}' in 4-bit precision with Unsloth...")\n`,
        `model, tokenizer = FastLanguageModel.from_pretrained(\n`,
        `    model_name = "${config.modelId}",\n`,
        `    max_seq_length = max_seq_length,\n`,
        `    dtype = dtype,\n`,
        `    load_in_4bit = load_in_4bit,\n`,
        `)\n`,
        `print(f"Gemma E4B 4-bit model loaded. VRAM allocated: {torch.cuda.memory_allocated() / (1024**3):.2f} GB")`
      ] : [
        `import torch\n`,
        `from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig\n`,
        `\n`,
        `model_id = "${config.modelId}"\n`,
        `print(f"Initializing 4-bit Quantization Configuration for: {model_id}")\n`,
        `\n`,
        `# Step 1: Configure BitsAndBytes 4-Bit NF4 Quantization\n`,
        `compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16\n`,
        `\n`,
        `bnb_config = BitsAndBytesConfig(\n`,
        `    load_in_4bit=True,\n`,
        `    bnb_4bit_quant_type="nf4",               # Normalized Float 4 (theoretically optimal for normal-distributed weights)\n`,
        `    bnb_4bit_compute_dtype=compute_dtype,    # Matrix multiplication compute dtype\n`,
        `    bnb_4bit_use_double_quant=True,          # Nested quantization (saves ~0.37 bits per parameter)\n`,
        `)\n`,
        `\n`,
        `# Step 2: Load Tokenizer with proper padding and Gemma special tokens\n`,
        `tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)\n`,
        `if tokenizer.pad_token is None:\n`,
        `    tokenizer.pad_token = tokenizer.eos_token\n`,
        `tokenizer.padding_side = "right"\n`,
        `\n`,
        `# Step 3: Load Gemma Model with 4-Bit Quantization\n`,
        `model = AutoModelForCausalLM.from_pretrained(\n`,
        `    model_id,\n`,
        `    quantization_config=bnb_config,\n`,
        `    device_map="auto",\n`,
        `    trust_remote_code=True,\n`,
        `    torch_dtype=compute_dtype,\n`,
        `)\n`,
        `\n`,
        `print("Gemma E4B quant 4 loaded successfully into GPU memory.")\n`,
        `print(f"GPU VRAM Footprint: {torch.cuda.memory_allocated() / (1024**3):.2f} GB")`
      ],
      execution_count: 4
    },
    {
      id: 'cell_06_peft_lora',
      cell_type: 'code',
      title: '06. Configure QLoRA Adapters on Gemma Attention & MLP Projections',
      description: 'Sets up Low-Rank Adaptation (LoRA) matrices targeting all linear projection layers',
      source: isUnsloth ? [
        `# Configure Unsloth QLoRA adapters\n`,
        `model = FastLanguageModel.get_peft_model(\n`,
        `    model,\n`,
        `    r = ${config.loraRank},\n`,
        `    target_modules = ${JSON.stringify(config.targetModules)},\n`,
        `    lora_alpha = ${config.loraAlpha},\n`,
        `    lora_dropout = ${config.loraDropout},\n`,
        `    bias = "none",\n`,
        `    use_gradient_checkpointing = "unsloth",\n`,
        `    random_state = 3407,\n`,
        `)\n`,
        `print("QLoRA adapters attached to Gemma linear projections.")`
      ] : [
        `from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training\n`,
        `\n`,
        `# Enable gradient checkpointing and prepare 4-bit weights for backpropagation\n`,
        `model = prepare_model_for_kbit_training(model)\n`,
        `\n`,
        `peft_config = LoraConfig(\n`,
        `    r=${config.loraRank},                               # Low-rank dimension\n`,
        `    lora_alpha=${config.loraAlpha},                     # Scaling parameter (typically 1x to 2x rank)\n`,
        `    target_modules=${JSON.stringify(config.targetModules)},\n`,
        `    lora_dropout=${config.loraDropout},\n`,
        `    bias="none",\n`,
        `    task_type="CAUSAL_LM"\n`,
        `)\n`,
        `\n`,
        `model = get_peft_model(model, peft_config)\n`,
        `\n`,
        `trainable_params, all_params = model.get_nb_trainable_parameters()\n`,
        `print(f"Trainable Parameters: {trainable_params:,} / {all_params:,} ({100 * trainable_params / all_params:.3f}% of total model)")`
      ],
      execution_count: 5
    },
    {
      id: 'cell_07_load_dataset_and_preprocess',
      cell_type: 'code',
      title: '07. Load OpenHermes Dataset with Preprocessing & Tokenization',
      description: 'Loads OpenHermes-2.5 via datasets library, maps to Gemma chat template, and tokenizes with train/validation split',
      source: [
        `from datasets import load_dataset\n`,
        `\n`,
        `print(f"Loading '{config.datasetName}' using Hugging Face datasets...")\n`,
        `# Load slice of dataset (default: ${config.sampleCount.toLocaleString()} samples)\n`,
        `raw_dataset = load_dataset("${config.datasetName}", split="train[:${config.sampleCount}]")\n`,
        `print(f"Raw dataset loaded: {len(raw_dataset)} total conversation samples.")\n`,
        `\n`,
        `# Preprocessing: Map OpenHermes ShareGPT conversation schema to Gemma 2 chat template\n`,
        `# Gemma Turn Structure:\n`,
        `# <start_of_turn>user\\n{system_prompt + instruction}<end_of_turn>\\n<start_of_turn>model\\n{response}<end_of_turn>\\n\n`,
        `\n`,
        `def format_openhermes_conversations(batch):\n`,
        `    formatted_texts = []\n`,
        `    for conversation in batch["conversations"]:\n`,
        `        formatted_prompt = ""\n`,
        `        system_context = ""\n`,
        `        for msg in conversation:\n`,
        `            role = msg.get("from")\n`,
        `            content = msg.get("value", "").strip()\n`,
        `            \n`,
        `            if role == "system":\n`,
        `                system_context = f"[Context / System Instructions: {content}]\\n\\n"\n`,
        `            elif role == "human":\n`,
        `                formatted_prompt += f"<start_of_turn>user\\n{system_context}{content}<end_of_turn>\\n"\n`,
        `                system_context = ""  # Attach system context once to the initial user turn\n`,
        `            elif role == "gpt":\n`,
        `                formatted_prompt += f"<start_of_turn>model\\n{content}<end_of_turn>\\n"\n`,
        `        \n`,
        `        formatted_texts.append(formatted_prompt)\n`,
        `    return {"text": formatted_texts}\n`,
        `\n`,
        `# Apply mapping transformation\n`,
        `formatted_dataset = raw_dataset.map(\n`,
        `    format_openhermes_conversations,\n`,
        `    batched=True,\n`,
        `    remove_columns=raw_dataset.column_names,\n`,
        `    desc="Formatting OpenHermes conversations into Gemma turn tokens"\n`,
        `)\n`,
        `\n`,
        `# Tokenization Preprocessing Check\n`,
        `def tokenize_check(batch):\n`,
        `    return tokenizer(\n`,
        `        batch["text"],\n`,
        `        truncation=True,\n`,
        `        max_length=${config.maxSeqLength},\n`,
        `        padding=False,\n`,
        `    )\n`,
        `\n`,
        `tokenized_dataset = formatted_dataset.map(\n`,
        `    tokenize_check,\n`,
        `    batched=True,\n`,
        `    desc="Tokenizing and verifying sequence length bounds"\n`,
        `)\n`,
        `\n`,
        `# Create explicit Train / Validation Split (90% Train, 10% Evaluation for Perplexity)\n`,
        `split_dataset = tokenized_dataset.train_test_split(test_size=0.10, seed=42)\n`,
        `train_dataset = split_dataset["train"]\n`,
        `eval_dataset = split_dataset["test"]\n`,
        `\n`,
        `print(f"Preprocessing Complete!")\n`,
        `print(f"- Training set:   {len(train_dataset)} samples")\n`,
        `print(f"- Validation set: {len(eval_dataset)} samples")\n`,
        `\n`,
        `print("\\n--- Inspection of Formatted Gemma Sample ---")\n`,
        `print(train_dataset[0]["text"][:500] + "... [truncated]")`
      ],
      execution_count: 6
    },
    {
      id: 'cell_08_setup_training_loop',
      cell_type: 'code',
      title: '08. Set Up Training Loop (TRL SFTTrainer & TrainingArguments)',
      description: 'Configures hyperparameters: learning rate, batch size, epochs, optimizer, and initializes SFTTrainer',
      source: [
        `from trl import SFTTrainer\n`,
        `from transformers import TrainingArguments\n`,
        `import torch\n`,
        `\n`,
        `use_bf16 = torch.cuda.is_bf16_supported()\n`,
        `use_fp16 = not use_bf16\n`,
        `\n`,
        `# Step 1: Configure TrainingArguments with precision hyperparameters\n`,
        `training_args = TrainingArguments(\n`,
        `    output_dir = "${config.outputDir}",\n`,
        `    per_device_train_batch_size = ${config.batchSize},          # Batch size per GPU\n`,
        `    per_device_eval_batch_size = ${config.batchSize},           # Batch size for evaluation\n`,
        `    gradient_accumulation_steps = ${config.gradientAccumulation},  # Effective batch = ${config.batchSize * config.gradientAccumulation}\n`,
        `    num_train_epochs = ${config.epochs},                          # Number of training epochs\n`,
        `    learning_rate = ${config.learningRate},                       # Peak learning rate\n`,
        `    warmup_ratio = ${config.warmupRatio},                         # Linear warmup fraction\n`,
        `    weight_decay = ${config.weightDecay},                       # Regularization parameter\n`,
        `    lr_scheduler_type = "${config.lrScheduler}",                # Cosine annealing decay\n`,
        `    optim = "${config.optim}",                     # 8-bit Paged AdamW optimizer for VRAM thrift\n`,
        `    fp16 = use_fp16,                                            # 16-bit float on T4\n`,
        `    bf16 = use_bf16,                                            # Bfloat16 on Ampere/A100\n`,
        `    logging_steps = 10,                                         # Telemetry logging frequency\n`,
        `    eval_strategy = "steps",                                    # Run evaluation every N steps\n`,
        `    eval_steps = 50,                                            # Compute validation loss periodically\n`,
        `    save_strategy = "steps",\n`,
        `    save_steps = 50,\n`,
        `    save_total_limit = 3,                                       # Retain top 3 checkpoints\n`,
        `    load_best_model_at_end = True,                              # Load lowest validation loss checkpoint\n`,
        `    metric_for_best_model = "eval_loss",\n`,
        `    report_to = "none",                                         # Set to 'wandb' if tracking experiments\n`,
        `    seed = 3407,\n`,
        `)\n`,
        `\n`,
        `# Step 2: Initialize Supervised Fine-Tuning (SFT) Trainer\n`,
        `trainer = SFTTrainer(\n`,
        `    model = model,\n`,
        `    tokenizer = tokenizer,\n`,
        `    train_dataset = train_dataset,\n`,
        `    eval_dataset = eval_dataset,                                # Validation set for loss and perplexity\n`,
        `    dataset_text_field = "text",\n`,
        `    max_seq_length = ${config.maxSeqLength},\n`,
        `    dataset_num_proc = 2,\n`,
        `    packing = False,                                            # Set True for concatenated sequence packing\n`,
        `    args = training_args,\n`,
        `)\n`,
        `\n`,
        `print("Training loop setup complete. SFTTrainer initialized with hyperparameter specifications.")`
      ],
      execution_count: 7
    },
    {
      id: 'cell_09_execute_training',
      cell_type: 'code',
      title: '09. Execute Supervised Fine-Tuning Training Loop',
      description: 'Runs training loop with step loss telemetry, timer, and peak memory tracking',
      source: [
        `import time\n`,
        `\n`,
        `print("=" * 65)\n`,
        `print(f"Beginning Training Loop on {torch.cuda.get_device_name(0)}")\n`,
        `print(f"Dataset Size: {len(train_dataset)} train samples | {len(eval_dataset)} validation samples")\n`,
        `print(f"Effective Batch Size: {${config.batchSize * config.gradientAccumulation}}")\n`,
        `print("=" * 65)\n`,
        `\n`,
        `start_time = time.time()\n`,
        `train_result = trainer.train()\n`,
        `total_time = time.time() - start_time\n`,
        `\n`,
        `print(f"\\nTraining finished in {total_time / 60:.2f} minutes.")\n`,
        `print(f"Peak VRAM consumption: {torch.cuda.max_memory_allocated() / (1024**3):.2f} GB")`
      ],
      execution_count: 8
    },
    {
      id: 'cell_10_eval_perplexity',
      cell_type: 'code',
      title: '10. Evaluate Fine-Tuned Gemma E4B & Calculate Perplexity',
      description: 'Computes validation cross-entropy loss and Perplexity (PPL = exp(loss)) on held-out test split',
      source: [
        `import math\n`,
        `import numpy as np\n`,
        `import matplotlib.pyplot as plt\n`,
        `\n`,
        `print("Running evaluation on validation set...")\n`,
        `eval_metrics = trainer.evaluate()\n`,
        `\n`,
        `eval_loss = eval_metrics.get("eval_loss", 0.0)\n`,
        `perplexity = math.exp(eval_loss) if eval_loss < 20 else float("inf")\n`,
        `\n`,
        `print("=" * 50)\n`,
        `print(f"Validation Cross-Entropy Loss: {eval_loss:.4f}")\n`,
        `print(f"Validation Perplexity (PPL):   {perplexity:.4f}")\n`,
        `print(f"Runtime / Sample Throughput:  {eval_metrics.get('eval_samples_per_second', 0.0):.2f} samples/sec")\n`,
        `print("=" * 50)\n`,
        `\n`,
        `# Plot Loss Convergence Curve\n`,
        `train_losses = [e["loss"] for e in trainer.state.log_history if "loss" in e]\n`,
        `train_steps = [e["step"] for e in trainer.state.log_history if "loss" in e]\n`,
        `val_losses = [e["eval_loss"] for e in trainer.state.log_history if "eval_loss" in e]\n`,
        `val_steps = [e["step"] for e in trainer.state.log_history if "eval_loss" in e]\n`,
        `\n`,
        `plt.figure(figsize=(10, 4.5))\n`,
        `plt.plot(train_steps, train_losses, label="Training Loss", color="#F97316", linewidth=2)\n`,
        `if val_losses:\n`,
        `    plt.plot(val_steps, val_losses, label="Validation Loss (Eval)", color="#06B6D4", marker="o", linewidth=2)\n`,
        `plt.title("Gemma E4B 4-Bit Fine-Tuning Loss Curve on OpenHermes-2.5", fontsize=12, fontweight="bold")\n`,
        `plt.xlabel("Training Step")\n`,
        `plt.ylabel("Cross-Entropy Loss")\n`,
        `plt.grid(True, linestyle="--", alpha=0.3)\n`,
        `plt.legend()\n`,
        `plt.tight_layout()\n`,
        `plt.show()`
      ],
      execution_count: 9
    },
    {
      id: 'cell_11_save_drive_hub',
      cell_type: 'code',
      title: '11. Save Checkpoints to Google Drive & Hugging Face Hub',
      description: 'Saves the fine-tuned LoRA adapter weights to Google Drive and pushes to Hugging Face Hub',
      source: [
        `import os\n`,
        `\n`,
        `# Destination directories\n`,
        `local_output = "${config.outputDir}_lora_final"\n`,
        `drive_destination = "/content/drive/MyDrive/gemma_e4b_openhermes_checkpoints"\n`,
        `\n`,
        `# 1. Save locally in Colab\n`,
        `model.save_pretrained(local_output)\n`,
        `tokenizer.save_pretrained(local_output)\n`,
        `print(f"Checkpoints saved to local directory: {local_output}")\n`,
        `\n`,
        `# 2. Save directly to mounted Google Drive (Persistent across Colab sessions)\n`,
        `if os.path.exists("/content/drive/MyDrive"):\n`,
        `    os.makedirs(drive_destination, exist_ok=True)\n`,
        `    model.save_pretrained(drive_destination)\n`,
        `    tokenizer.save_pretrained(drive_destination)\n`,
        `    print(f"SUCCESS: Checkpoints backed up to Google Drive at:\\n  -> {drive_destination}")\n`,
        `else:\n`,
        `    print("Notice: Google Drive was not mounted. Checkpoint preserved in local instance.")\n`,
        `\n`,
        `# 3. Push to Hugging Face Hub (Optional)\n`,
        `hub_id = "${config.hubModelId}"\n`,
        `if hub_id and "username" not in hub_id:\n`,
        `    print(f"Uploading fine-tuned adapter weights to Hugging Face Hub repo: '{hub_id}'...")\n`,
        `    model.push_to_hub(hub_id, private=False)\n`,
        `    tokenizer.push_to_hub(hub_id)\n`,
        `    print(f"Model successfully published to: https://huggingface.co/{hub_id}")\n`,
        `else:\n`,
        `    print("To publish to Hugging Face Hub, set your repo ID: e.g., model.push_to_hub('your-username/gemma-e4b-openhermes')")\n`
      ],
      execution_count: 10
    },
    {
      id: 'cell_12_inference_verification',
      cell_type: 'code',
      title: '12. Interactive Model Testing & Generation Sandbox',
      description: 'Runs inference using Gemma conversational turn formatting on OpenHermes-style reasoning prompts',
      source: [
        `import torch\n`,
        `from transformers import TextStreamer\n`,
        `\n`,
        `model.eval()\n`,
        `streamer = TextStreamer(tokenizer, skip_prompt=True)\n`,
        `\n`,
        `prompts_to_test = [\n`,
        `    "Explain the difference between quantum superposition and quantum entanglement to a high schooler.",\n`,
        `    "Write an optimal Python solution for finding the longest palindromic substring with detailed explanation.",\n`,
        `    "A train leaves Station A at 50 mph. Two hours later, a second train leaves Station A at 75 mph along the same track. How long does it take for the second train to overtake the first?"\n`,
        `]\n`,
        `\n`,
        `for i, prompt in enumerate(prompts_to_test, 1):\n`,
        `    print(f"\\n{'='*25} Test Prompt {i} {'='*25}")\n`,
        `    print(f"User: {prompt}\\n")\n`,
        `    \n`,
        `    formatted = f"<start_of_turn>user\\n{prompt}<end_of_turn>\\n<start_of_turn>model\\n"\n`,
        `    inputs = tokenizer(formatted, return_tensors="pt").to("cuda")\n`,
        `    \n`,
        `    print("--- Gemma E4B Fine-Tuned Output ---")\n`,
        `    with torch.no_grad():\n`,
        `        _ = model.generate(\n`,
        `            **inputs,\n`,
        `            streamer=streamer,\n`,
        `            max_new_tokens=320,\n`,
        `            temperature=0.7,\n`,
        `            top_p=0.9,\n`,
        `            repetition_penalty=1.1,\n`,
        `            do_sample=True\n`,
        `        )`
      ],
      execution_count: 11
    }
  ];
}

export function buildNotebookJson(config: TrainingConfig): string {
  const cells = generateNotebookCells(config);

  const ipynbCells = cells.map(cell => ({
    cell_type: cell.cell_type,
    metadata: {
      id: cell.id,
      collapsed: false
    },
    source: cell.source,
    ...(cell.cell_type === 'code' ? {
      execution_count: cell.execution_count,
      outputs: []
    } : {})
  }));

  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      colab: {
        provenance: [],
        gpuType: config.gpu.toUpperCase(),
        authorship_tag: "GemmaForge Colab Builder"
      },
      kernelspec: {
        name: "python3",
        display_name: "Python 3 (ipykernel)"
      },
      language_info: {
        name: "python"
      },
      accelerator: "GPU"
    },
    cells: ipynbCells
  };

  return JSON.stringify(notebook, null, 2);
}

export function buildStandalonePythonScript(config: TrainingConfig): string {
  const isUnsloth = config.framework === 'unsloth';
  return `"""
Fine-Tuning Gemma E4B in 4-bit Quantization (QLoRA) with OpenHermes-2.5
Target Model: ${config.modelId}
Dataset:      ${config.datasetName} (${config.sampleCount} samples)
Generated by GemmaForge Studio
"""

import os
import math
import time
import torch
from datasets import load_dataset
from transformers import TrainingArguments, AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# 1. 4-bit Quantization Configuration
compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=compute_dtype,
    bnb_4bit_use_double_quant=True,
)

model_id = "${config.modelId}"
print(f"Loading {model_id} in 4-bit precision...")

tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=compute_dtype,
)

model = prepare_model_for_kbit_training(model)
peft_config = LoraConfig(
    r=${config.loraRank},
    lora_alpha=${config.loraAlpha},
    target_modules=${JSON.stringify(config.targetModules)},
    lora_dropout=${config.loraDropout},
    bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(model, peft_config)

# 2. Load & Preprocess OpenHermes Dataset
print("Loading and preprocessing ${config.datasetName}...")
raw_dataset = load_dataset("${config.datasetName}", split="train[:${config.sampleCount}]")

def format_openhermes_conversations(batch):
    formatted_texts = []
    for conversation in batch["conversations"]:
        formatted_prompt = ""
        system_context = ""
        for msg in conversation:
            role = msg.get("from")
            content = msg.get("value", "").strip()
            if role == "system":
                system_context = f"[Context / System Instructions: {content}]\\n\\n"
            elif role == "human":
                formatted_prompt += f"<start_of_turn>user\\n{system_context}{content}<end_of_turn>\\n"
                system_context = ""
            elif role == "gpt":
                formatted_prompt += f"<start_of_turn>model\\n{content}<end_of_turn>\\n"
        formatted_texts.append(formatted_prompt)
    return {"text": formatted_texts}

formatted_dataset = raw_dataset.map(format_openhermes_conversations, batched=True, remove_columns=raw_dataset.column_names)
split_dataset = formatted_dataset.train_test_split(test_size=0.10, seed=42)
train_dataset = split_dataset["train"]
eval_dataset = split_dataset["test"]

# 3. Set Up Supervised Fine-Tuning Training Loop
training_args = TrainingArguments(
    output_dir = "${config.outputDir}",
    per_device_train_batch_size = ${config.batchSize},
    per_device_eval_batch_size = ${config.batchSize},
    gradient_accumulation_steps = ${config.gradientAccumulation},
    warmup_ratio = ${config.warmupRatio},
    num_train_epochs = ${config.epochs},
    learning_rate = ${config.learningRate},
    fp16 = not torch.cuda.is_bf16_supported(),
    bf16 = torch.cuda.is_bf16_supported(),
    logging_steps = 10,
    eval_strategy = "steps",
    eval_steps = 50,
    optim = "${config.optim}",
    weight_decay = ${config.weightDecay},
    lr_scheduler_type = "${config.lrScheduler}",
    save_strategy = "steps",
    save_steps = 50,
    seed = 3407,
)

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = train_dataset,
    eval_dataset = eval_dataset,
    dataset_text_field = "text",
    max_seq_length = ${config.maxSeqLength},
    dataset_num_proc = 2,
    args = training_args,
)

# 4. Train
print("Starting training loop...")
trainer.train()

# 5. Evaluate Validation Perplexity
eval_metrics = trainer.evaluate()
eval_loss = eval_metrics.get("eval_loss", 0.0)
perplexity = math.exp(eval_loss)
print(f"Validation Loss: {eval_loss:.4f} | Perplexity (PPL): {perplexity:.4f}")

# 6. Save Checkpoints
local_dir = "${config.outputDir}_lora_final"
model.save_pretrained(local_dir)
tokenizer.save_pretrained(local_dir)
print(f"Checkpoints saved to {local_dir}")
`;
}
