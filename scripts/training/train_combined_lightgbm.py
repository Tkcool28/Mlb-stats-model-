import json
from pathlib import Path
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import log_loss, accuracy_score, roc_auc_score, brier_score_loss

CFG_PATH = Path('configs/combined_lightgbm_features.json')
REPORT_PATH = Path('reports/training/combined_lightgbm_training_report.md')
FI_PATH = Path('reports/training/combined_lightgbm_feature_importance.csv')
MODEL_PATH = Path('models/team_pitching/lightgbm_team_pitching_2010_2025.txt')


def bucket_table(y, p):
    bins = np.linspace(0,1,11)
    idx = np.digitize(p, bins, right=False)-1
    rows=[]
    for i in range(10):
        m = idx==i
        if m.sum()==0:
            rows.append((f'{bins[i]:.1f}-{bins[i+1]:.1f}',0,np.nan,np.nan))
        else:
            rows.append((f'{bins[i]:.1f}-{bins[i+1]:.1f}',int(m.sum()),float(p[m].mean()),float(y[m].mean())))
    return rows

def metrics(y,p):
    pred=(p>=0.5).astype(int)
    out={
        'log_loss': float(log_loss(y,p,labels=[0,1])),
        'accuracy': float(accuracy_score(y,(p>=0.5).astype(int))),
        'brier': float(brier_score_loss(y,p))
    }
    try: out['roc_auc']=float(roc_auc_score(y,p))
    except Exception: out['roc_auc']=float('nan')
    return out

def main():
    cfg=json.loads(CFG_PATH.read_text())
    df=pd.read_csv(cfg['dataset_path'])
    target=cfg['target_column']
    feats=cfg['feature_columns']
    excl=set(sum(cfg['excluded_columns'].values(),[]))
    assert target in df.columns
    missing=[c for c in feats if c not in df.columns]
    if missing: raise ValueError(f'Missing features: {missing[:10]}')
    bad=[c for c in feats if c in excl]
    if bad: raise ValueError(f'Excluded columns in features: {bad[:10]}')
    nonnum=[c for c in feats if not pd.api.types.is_numeric_dtype(df[c])]
    if nonnum: raise ValueError(f'Non-numeric features: {nonnum[:10]}')
    if df[target].isna().any(): raise ValueError('Missing target values')

    sp=cfg['split']
    tr=df[(df['season']>=sp['train']['start_season'])&(df['season']<=sp['train']['end_season'])]
    va=df[(df['season']>=sp['validation']['start_season'])&(df['season']<=sp['validation']['end_season'])]
    te=df[(df['season']>=sp['test']['start_season'])&(df['season']<=sp['test']['end_season'])]
    if min(len(tr),len(va),len(te))==0: raise ValueError('Empty split detected')

    Xtr,ytr=tr[feats],tr[target].astype(int)
    Xva,yva=va[feats],va[target].astype(int)
    Xte,yte=te[feats],te[target].astype(int)

    model=lgb.LGBMClassifier(objective='binary',learning_rate=0.03,num_leaves=31,n_estimators=1000,subsample=0.8,colsample_bytree=0.8,random_state=42)
    try:
        model.fit(Xtr,ytr,eval_set=[(Xva,yva)],eval_metric='binary_logloss',callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)])
    except Exception:
        model.fit(Xtr,ytr)

    pva=model.predict_proba(Xva)[:,1]
    pte=model.predict_proba(Xte)[:,1]
    mva=metrics(yva.values,pva)
    mte=metrics(yte.values,pte)

    base_p=float(ytr.mean())
    base_pred=int(base_p>=0.5)
    base_acc=float((yte.values==base_pred).mean())
    base_ll=float(log_loss(yte.values,np.full(len(yte),base_p),labels=[0,1]))

    imp=pd.DataFrame({'feature':feats,'importance':model.feature_importances_}).sort_values('importance',ascending=False)
    FI_PATH.parent.mkdir(parents=True,exist_ok=True)
    imp.to_csv(FI_PATH,index=False)

    MODEL_PATH.parent.mkdir(parents=True,exist_ok=True)
    model.booster_.save_model(str(MODEL_PATH))
    msize=MODEL_PATH.stat().st_size

    cal=bucket_table(yte.values,pte)
    top20=imp.head(20)
    lines=['# Combined LightGBM Training Report','',f'- dataset path: `{cfg["dataset_path"]}`',f'- feature config path: `{CFG_PATH}`',f'- train rows: {len(tr)}',f'- validation rows: {len(va)}',f'- test rows: {len(te)}',f'- train seasons: {tr.season.min()}-{tr.season.max()}',f'- validation seasons: {va.season.min()}-{va.season.max()}',f'- test seasons: {te.season.min()}-{te.season.max()}',f'- target mean train/val/test: {ytr.mean():.4f}/{yva.mean():.4f}/{yte.mean():.4f}','','## Baseline metrics',f'- train home win rate probability: {base_p:.6f}',f'- baseline test accuracy: {base_acc:.6f}',f'- baseline test log loss: {base_ll:.6f}','','## LightGBM validation metrics']
    lines += [f'- {k}: {v:.6f}' for k,v in mva.items()]
    lines += ['','## LightGBM test metrics'] + [f'- {k}: {v:.6f}' for k,v in mte.items()]
    lines += ['','## Top 20 features'] + [f'- {r.feature}: {int(r.importance)}' for _,r in top20.iterrows()]
    lines += ['','## Calibration table (test)','|bucket|count|avg_pred|actual_home_win_rate|','|---|---:|---:|---:|']
    for b,c,ap,aw in cal: lines.append(f'|{b}|{c}|{ap if ap==ap else ""}|{aw if aw==aw else ""}|')
    lines += ['','## Artifact',f'- model artifact path: `{MODEL_PATH}`',f'- model artifact size bytes: {msize}','','## Leakage sanity notes','- Checked configured exclusions for identifiers/date/teams/target and suspicious columns prior to fit.','- If metrics appear unusually strong, re-audit suspicious columns and split leakage.']
    REPORT_PATH.parent.mkdir(parents=True,exist_ok=True)
    REPORT_PATH.write_text('\n'.join(lines))

    print(json.dumps({'train_rows':len(tr),'validation_rows':len(va),'test_rows':len(te),'validation':mva,'test':mte,'baseline_test_accuracy':base_acc,'baseline_test_log_loss':base_ll,'model_path':str(MODEL_PATH),'model_size_bytes':msize,'top20':top20['feature'].tolist()},indent=2))

if __name__=='__main__':
    main()
