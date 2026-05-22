import fs from 'fs';
import path from 'path';

/**
 * Standard Feature Scaling (Standardization)
 */
export class StandardScalers {
  means: number[] = [];
  stds: number[] = [];

  fit(X: number[][]): void {
    const nSamples = X.length;
    if (nSamples === 0) return;
    const nFeatures = X[0].length;

    this.means = Array(nFeatures).fill(0);
    this.stds = Array(nFeatures).fill(0);

    for (let f = 0; f < nFeatures; f++) {
      let sum = 0;
      for (let s = 0; s < nSamples; s++) {
        sum += X[s][f];
      }
      this.means[f] = sum / nSamples;

      let varianceSum = 0;
      for (let s = 0; s < nSamples; s++) {
        varianceSum += Math.pow(X[s][f] - this.means[f], 2);
      }
      this.stds[f] = Math.sqrt(varianceSum / nSamples) || 1e-8; // prevent division by zero
    }
  }

  transform(X: number[][]): number[][] {
    return X.map(row =>
      row.map((val, idx) => (val - this.means[idx]) / this.stds[idx])
    );
  }

  transformRow(row: number[]): number[] {
    return row.map((val, idx) => (val - this.means[idx]) / this.stds[idx]);
  }
}

/**
 * Original Logistic Regression for backward compatibility
 */
export class LogisticRegressionClassifier {
  weights: number[] = [];
  bias: number = 0;
  learningRate: number = 0.05;
  l2Reg: number = 0.05;
  epochs: number = 500;
  scaler: StandardScalers = new StandardScalers();

  fit(X: number[][], y: number[]): void {
    const nSamples = X.length;
    if (nSamples === 0) return;
    const nFeatures = X[0].length;

    this.scaler.fit(X);
    const scaledX = this.scaler.transform(X);

    this.weights = Array(nFeatures).fill(0);
    this.bias = 0;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      let dw = Array(nFeatures).fill(0);
      let db = 0;

      for (let i = 0; i < nSamples; i++) {
        const xi = scaledX[i];
        const yi = y[i];

        let linearModel = this.bias;
        for (let j = 0; j < nFeatures; j++) {
          linearModel += xi[j] * this.weights[j];
        }

        const pi = 1 / (1 + Math.exp(-linearModel));
        const error = pi - yi;

        db += error;
        for (let j = 0; j < nFeatures; j++) {
          dw[j] += error * xi[j];
        }
      }

      this.bias -= (this.learningRate * db) / nSamples;
      for (let j = 0; j < nFeatures; j++) {
        dw[j] = dw[j] / nSamples + this.l2Reg * this.weights[j];
        this.weights[j] -= this.learningRate * dw[j];
      }
    }
  }

  predict_proba(row: number[]): number {
    const scaled = this.scaler.transformRow(row);
    let score = this.bias;
    for (let j = 0; j < scaled.length; j++) {
      score += scaled[j] * this.weights[j];
    }
    return 1 / (1 + Math.exp(-score));
  }

  predict(row: number[]): number {
    return this.predict_proba(row) >= 0.5 ? 1 : 0;
  }
}

/**
 * 
 * Perfect No-Leakage LightGBM Evaluation Node Structures
 */
export interface LightGBMNode {
  split_feature?: string | number;
  threshold?: number;
  left_child?: LightGBMNode;
  right_child?: LightGBMNode;
  leaf_value?: number;
}

export interface LightGBMTree {
  tree_index: number;
  tree_structure: LightGBMNode;
}

export interface LightGBMDump {
  feature_names?: string[];
  tree_info: LightGBMTree[];
}

/**
 * 🌲 LightGBM Predictor in Pure TypeScript
 * Evaluates the complex decision tree ensembles natively with zero dependencies.
 */
export class LightGBMClassifier {
  modelData: LightGBMDump | null = null;
  features: string[] = [
    "home_win_pct_pre_game",
    "away_win_pct_pre_game",
    "home_run_diff_per_game_pre_game",
    "away_run_diff_per_game_pre_game",
    "home_runs_scored_per_game_pre_game",
    "away_runs_scored_per_game_pre_game",
    "home_runs_allowed_per_game_pre_game",
    "away_runs_allowed_per_game_pre_game",
    "home_last_10_win_pct",
    "away_last_10_win_pct",
    "home_last_10_run_diff_per_game",
    "away_last_10_run_diff_per_game",
    "home_games_played_to_date",
    "away_games_played_to_date",
    "home_field_flag"
  ];

  constructor() {
    this.loadModel();
  }

  loadModel(): void {
    try {
      const modelPath = path.resolve('./models/stats_model/lightgbm_stats_moneyline.json');
      if (fs.existsSync(modelPath)) {
        this.modelData = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
        console.log(`[LightGBMClassifier] Loaded LightGBM model with ${this.modelData?.tree_info?.length || 0} trees.`);
      } else {
        console.warn(`[LightGBMClassifier] Warning: Model JSON not found at ${modelPath}.`);
      }
    } catch (e) {
      console.error('[LightGBMClassifier] Error parsing tree JSON model:', e);
    }
  }

  private evaluateNode(node: LightGBMNode, features: Record<string, number>): number {
    if (node.leaf_value !== undefined) {
      return node.leaf_value;
    }
    
    let featName: string | undefined;
    const rawFeat = node.split_feature;
    if (rawFeat !== undefined) {
      if (typeof rawFeat === 'number') {
        featName = this.modelData?.feature_names?.[rawFeat] || this.features[rawFeat];
      } else if (typeof rawFeat === 'string') {
        const parsedIdx = parseInt(rawFeat, 10);
        if (!isNaN(parsedIdx)) {
          featName = this.modelData?.feature_names?.[parsedIdx] || this.features[parsedIdx];
        } else {
          featName = rawFeat;
        }
      }
    }

    const val = (featName && features[featName] !== undefined) ? features[featName] : 0.0;
    
    // Default comparison operator in LightGBM booster dump is '<='
    if (val <= node.threshold!) {
      return this.evaluateNode(node.left_child!, features);
    } else {
      return this.evaluateNode(node.right_child!, features);
    }
  }

  predict_proba(features: Record<string, number>): number {
    if (!this.modelData || !this.modelData.tree_info || this.modelData.tree_info.length === 0) {
      return 0.54; // default baseball home-edge fallback
    }
    let marginSum = 0.0;
    for (const tree of this.modelData.tree_info) {
      marginSum += this.evaluateNode(tree.tree_structure, features);
    }
    // Convert margin sum to probability via sigmoid function
    return 1 / (1 + Math.exp(-marginSum));
  }

  predict(features: Record<string, number>): number {
    return this.predict_proba(features) >= 0.5 ? 1 : 0;
  }
}

export const featureNames = [
  'Team Seasonal Strength (Win %)',
  'True Run Differential Diff',
  'Starter ERA Diff',
  'Starter WHIP Diff',
  'Starter Strikeout-Walk Ratio',
  'Bullpen Save %',
  'Home-Field Advantage'
];
