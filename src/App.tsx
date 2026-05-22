import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  TrendingUp, 
  Shield, 
  Layers, 
  HelpCircle, 
  Download, 
  Copy, 
  Check, 
  RefreshCw,
  Cpu,
  Bookmark,
  ChevronRight,
  Database,
  ThumbsUp,
  User,
  Percent,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ModelMetrics, TeamStatsSeason } from './types';

// Standard MLB Team Name mapped to standard abbreviations
const teamAbbrToName: Record<string, string> = {
  ANA: 'Los Angeles Angels', ARI: 'Arizona Diamondbacks', ATL: 'Atlanta Braves', BAL: 'Baltimore Orioles',
  BOS: 'Boston Red Sox', CHC: 'Chicago Cubs', CHW: 'Chicago White Sox', CIN: 'Cincinnati Reds',
  CLE: 'Cleveland Guardians', COL: 'Colorado Rockies', DET: 'Detroit Tigers', HOU: 'Houston Astros',
  KCR: 'Kansas City Royals', LAD: 'Los Angeles Dodgers', MIA: 'Miami Marlins', MIL: 'Milwaukee Brewers',
  MIN: 'Minnesota Twins', NYM: 'New York Mets', NYY: 'New York Yankees', OAK: 'Oakland Athletics',
  PHI: 'Philadelphia Phillies', PIT: 'Pittsburgh Pirates', SDP: 'San Diego Padres', SFG: 'San Francisco Giants',
  SEA: 'Seattle Mariners', STL: 'St. Louis Cardinals', TBR: 'Tampa Bay Rays', TEX: 'Texas Rangers',
  TOR: 'Toronto Blue Jays', WSN: 'Washington Nationals'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'matchup' | 'performance' | 'export'>('matchup');
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [teams, setTeams] = useState<TeamStatsSeason[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduledGames, setScheduledGames] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  
  const [refreshIndicator, setRefreshIndicator] = useState(0);
  const [showManualForm, setShowManualForm] = useState(false);

  // Predictor stats state (Form overrides)
  const [predictorState, setPredictorState] = useState({
    homeAbbr: 'LAD',
    awayAbbr: 'NYY',
    homeTeamWinPct: 0.58,
    awayTeamWinPct: 0.55,
    homeRunsPG: 4.8,
    awayRunsPG: 4.6,
    homePitchingERA: 3.8,
    awayPitchingERA: 4.0,
    homePitchingWHIP: 1.22,
    awayPitchingWHIP: 1.25,
    homeBattingOPS: 0.765,
    awayBattingOPS: 0.750,
    homeStarterERA: 3.65,
    awayStarterERA: 3.85,
    homeStarterWHIP: 1.18,
    awayStarterWHIP: 1.21,
    homeStarterSOBB: 2.8,
    awayStarterSOBB: 2.6,
    homeStarterHand: 'R',
    awayStarterHand: 'R',
    homeSavePct: 0.72,
    awaySavePct: 0.70
  });

  const [predictResult, setPredictResult] = useState<{
    homeWinProb: number;
    awayWinProb: number;
    prediction: string;
    bias?: number;
    contributions?: Array<{
      name: string;
      rawValue: number;
      weight: number;
      scaledValue: number;
      contribution: number;
    }>;
  } | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pythonCode, setPythonCode] = useState('');

  // Fetch performance metrics and teams list on load
  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoadingMetrics(false);
      })
      .catch(err => console.error('Error fetching metrics:', err));

    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        setTeams(data);
      })
      .catch(err => console.error('Error fetching teams:', err));

    fetch('/api/export-python')
      .then(res => res.text())
      .then(code => setPythonCode(code))
      .catch(err => console.error('Error fetching python export:', err));
  }, []);

  // Fetch schedule whenever date changes or manual refresh is clicked
  useEffect(() => {
    setLoadingSchedule(true);
    fetch(`/api/schedule?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        setScheduledGames(data);
        setLoadingSchedule(false);
        // Automatically select and predict first game if available
        if (data && data.length > 0) {
          hydrateGame(data[0]);
        } else {
          setSelectedGame(null);
        }
      })
      .catch(err => {
        console.error('Error loading schedule:', err);
        setLoadingSchedule(false);
      });
  }, [selectedDate, refreshIndicator]);

  // Automated live prediction fetch when predictorState changes (unless manual overrides are actively focused)
  useEffect(() => {
    if (selectedGame) {
      const controller = new AbortController();
      setPredicting(true);
      fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictorState),
        signal: controller.signal
      })
      .then(res => res.json())
      .then(data => {
        setPredictResult(data);
        setPredicting(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setPredicting(false);
        }
      });
      return () => controller.abort();
    }
  }, [
    predictorState.homeAbbr,
    predictorState.awayAbbr,
    predictorState.homeStarterERA,
    predictorState.awayStarterERA,
    predictorState.homeStarterWHIP,
    predictorState.awayStarterWHIP,
    predictorState.homeTeamWinPct,
    predictorState.awayTeamWinPct,
    predictorState.homeRunsPG,
    predictorState.awayRunsPG,
    predictorState.homePitchingERA,
    predictorState.awayPitchingERA,
    predictorState.homePitchingWHIP,
    predictorState.awayPitchingWHIP,
    predictorState.homeSavePct,
    predictorState.awaySavePct,
    selectedGame?.gamePk
  ]);

  // Pre-fill the prediction form states from custom choosing or selected game
  const hydrateGame = (game: any) => {
    setSelectedGame(game);
    const homeProfile = teams.find(t => t.abbr === game.homeAbbr);
    const awayProfile = teams.find(t => t.abbr === game.awayAbbr);

    setPredictorState({
      homeAbbr: game.homeAbbr,
      awayAbbr: game.awayAbbr,
      homeTeamWinPct: homeProfile ? parseFloat(homeProfile.pitching?.winPercentage || '0.500') : 0.500,
      awayTeamWinPct: awayProfile ? parseFloat(awayProfile.pitching?.winPercentage || '0.500') : 0.500,
      homeRunsPG: homeProfile ? parseFloat(homeProfile.advancedPitching?.runsScoredPer9 || '4.50') : 4.50,
      awayRunsPG: awayProfile ? parseFloat(awayProfile.advancedPitching?.runsScoredPer9 || '4.50') : 4.50,
      homePitchingERA: homeProfile ? parseFloat(homeProfile.pitching?.era || '4.20') : 4.20,
      awayPitchingERA: awayProfile ? parseFloat(awayProfile.pitching?.era || '4.20') : 4.20,
      homePitchingWHIP: homeProfile ? parseFloat(homeProfile.pitching?.whip || '1.30') : 1.30,
      awayPitchingWHIP: awayProfile ? parseFloat(awayProfile.pitching?.whip || '1.30') : 1.30,
      homeBattingOPS: homeProfile ? parseFloat(homeProfile.batting?.ops || '0.730') : 0.730,
      awayBattingOPS: awayProfile ? parseFloat(awayProfile.batting?.ops || '0.730') : 0.730,
      
      homeStarterERA: game.homeStarterERA || 4.20,
      awayStarterERA: game.awayStarterERA || 4.20,
      homeStarterWHIP: game.homeStarterWHIP || 1.30,
      awayStarterWHIP: game.awayStarterWHIP || 1.30,
      homeStarterSOBB: 2.7, // standard default
      awayStarterSOBB: 2.7,
      homeStarterHand: game.homeStarterHand || 'R',
      awayStarterHand: game.awayStarterHand || 'R',
      
      homeSavePct: homeProfile ? (parseInt((homeProfile.pitching?.saves || 0).toString()) / (parseInt((homeProfile.pitching?.saves || 0).toString()) + parseInt((homeProfile.pitching?.blownSaves || 0).toString()))) || 0.70 : 0.70,
      awaySavePct: awayProfile ? (parseInt((awayProfile.pitching?.saves || 0).toString()) / (parseInt((awayProfile.pitching?.saves || 0).toString()) + parseInt((awayProfile.pitching?.blownSaves || 0).toString()))) || 0.70 : 0.70
    });
    setPredictResult(null);
  };

  // Run team selector hydration manually if custom matchup
  const handleTeamChange = (role: 'home' | 'away', abbr: string) => {
    const profile = teams.find(t => t.abbr === abbr);
    if (!profile) return;

    setPredictorState(prev => ({
      ...prev,
      [`${role}Abbr`]: abbr,
      [`${role}TeamWinPct`]: parseFloat(profile.pitching?.winPercentage || '0.500'),
      [`${role}RunsPG`]: parseFloat(profile.advancedPitching?.runsScoredPer9 || '4.50'),
      [`${role}PitchingERA`]: parseFloat(profile.pitching?.era || '4.20'),
      [`${role}PitchingWHIP`]: parseFloat(profile.pitching?.whip || '1.30'),
      [`${role}BattingOPS`]: parseFloat(profile.batting?.ops || '0.730'),
      [`${role}StarterERA`]: parseFloat(profile.pitching?.era || '4.20'), // fallback starter
      [`${role}StarterWHIP`]: parseFloat(profile.pitching?.whip || '1.30'),
      [`${role}SavePct`]: (parseInt((profile.pitching?.saves || 0).toString()) / (parseInt((profile.pitching?.saves || 0).toString()) + parseInt((profile.pitching?.blownSaves || 0).toString()))) || 0.70
    }));
    setSelectedGame(null);
    setPredictResult(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictorState)
      });
      const data = await res.json();
      setPredictResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPredicting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col antialiased">
      {/* 1. Header */}
      <header className="border-b border-slate-850 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-6 h-6 animate-pulse" id="aistudio-header-logo" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg tracking-tight text-white">MLB Predictive Engine</h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full font-medium">LightGBM (Primary)</span>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Manual Fallback Mode Included</span>
              </div>
              <p className="text-xs text-slate-400">Chronological Decision Tree Ensemble with No-Leakage Sourcing (2010-2025)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button 
              id="tab-matchup"
              onClick={() => setActiveTab('matchup')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'matchup' ? 'bg-slate-850 hover:bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🔮 Live Matchup Panel
            </button>
            <button 
              id="tab-performance"
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'performance' ? 'bg-slate-850 hover:bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📊 Holdout Backtest Metrics
            </button>
            <button 
              id="tab-export"
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'export' ? 'bg-slate-850 hover:bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🚀 Streamlit Copy Code
            </button>
          </div>
        </div>
      </header>

      {/* Database status banner */}
      <div className="bg-emerald-950/20 py-2 border-b border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-4 text-xs font-mono text-emerald-400 justify-center sm:justify-start">
          <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> 38,050 COMPLETED GAMES</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> 480 REAL TEAM SEASONS</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> 12,298 PITCHERS</span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> 2021-2025 HOLDOUT SEASONS BACKTEST</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {loadingMetrics ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-mono text-slate-400">Loading historical data and compiling weights...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'matchup' && (
              <motion.div 
                key="matchup"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left Panel: Schedule chooser */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Schedule Chooser Card */}
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-emerald-400 w-4 h-4" />
                        <h2 className="font-semibold text-sm text-white">Daily Matchups Hydrator</h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRefreshIndicator(p => p + 1)}
                          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-950 hover:bg-slate-850 rounded-lg border border-slate-800 hover:border-slate-755 transition-all cursor-pointer"
                          title="Refresh Live Slate Pull"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingSchedule ? "animate-spin text-emerald-400" : ""}`} />
                        </button>
                        <span className="text-[9px] uppercase font-mono font-bold bg-slate-950 text-emerald-400 px-2 py-1 rounded border border-slate-800">
                          LIVE MLB
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 block font-mono">Select Game Date</label>
                      <input 
                        type="date"
                        min="2010-04-04"
                        max="2028-10-01"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 block leading-tight">Query live games on this date. Hydrates rosters & seasonal parameters dynamically from official MLB databases.</span>
                    </div>

                    {/* Best Pick Section */}
                    {(() => {
                      if (!scheduledGames || scheduledGames.length === 0) return null;
                      const best = scheduledGames.reduce((acc: any, current: any) => {
                        if (!acc || current.confidence > acc.confidence) return current;
                        return acc;
                      }, null);
                      if (!best) return null;
                      return (
                        <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            Engine's Best Pick of the Day
                          </div>
                          <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col gap-2 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[10.5px] font-bold font-mono text-emerald-400 uppercase">
                                Pred Pick: {best.predictedWinnerAbbr}
                              </span>
                              <span className="text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">
                                {(best.confidence * 100).toFixed(1)}% Conf
                              </span>
                            </div>
                            <div className="text-xs text-slate-350">
                              <span><span className="text-slate-400">✈️</span> {best.awayAbbr} @ <span className="text-slate-400 font-bold">🏠</span> {best.homeAbbr}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 leading-tight">
                              Starters: {best.awayStarterName} vs {best.homeStarterName}
                            </div>
                            <button
                              type="button"
                              onClick={() => hydrateGame(best)}
                              className="w-full mt-1.5 py-1.5 bg-slate-950 border border-emerald-500/10 hover:border-emerald-500/30 transition-all text-[10.5px] font-mono font-semibold rounded-lg text-emerald-400 hover:text-emerald-350 cursor-pointer text-center"
                            >
                              ANALYZE BEST PICK
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Schedule Lists */}
                    <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
                      <p className="text-xs font-mono text-slate-400 mb-1">Available Hydrated Games:</p>
                      
                      {loadingSchedule ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                          <span className="text-xs text-slate-500">Querying live MLB schedule...</span>
                        </div>
                      ) : scheduledGames.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-850 rounded-xl p-4">
                          No official games returned for this date. Change date above or toggle manual override.
                        </div>
                      ) : (
                        <div className="max-h-[350px] overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbars">
                          {scheduledGames.map((game) => (
                            <button
                              key={game.gamePk}
                              onClick={() => hydrateGame(game)}
                              className={`w-full text-left p-3 rounded-xl transition-all border flex flex-col gap-1.5 ${selectedGame?.gamePk === game.gamePk ? 'bg-slate-800/80 border-slate-700 shadow-sm' : 'bg-slate-950 hover:bg-slate-900 border-slate-850 hover:border-slate-800'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-emerald-400">{game.time} -- Active</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                              </div>
                              <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
                                <span><span className="text-slate-400">✈️</span> {game.awayAbbr} @ <span className="text-slate-400">🏠</span> {game.homeAbbr}</span>
                                {game.predictedWinnerAbbr && (
                                  <span className="text-[10.5px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">
                                    {(game.confidence * 100).toFixed(1)}% Pick
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-450 leading-none truncate mt-0.5 border-b border-slate-850/30 pb-1.5">
                                Pitchers: <span className="text-slate-300">{game.awayStarterName}</span> vs <span className="text-slate-300">{game.homeStarterName}</span>
                              </div>
                              {game.predictedWinnerAbbr && (
                                <div className="text-[10px] font-mono flex items-center justify-between text-slate-400 mt-1">
                                  <span>Model Pick: <strong className="text-emerald-400 font-bold">{game.predictedWinnerAbbr}</strong></span>
                                  <span>Win Prob: {game.predictedWinnerAbbr === game.homeAbbr ? (game.homeWinProb * 100).toFixed(0) : (game.awayWinProb * 100).toFixed(0)}%</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                 {/* Right Panel: Matchup Predictor controls */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Mode Selector Toolbar */}
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3 font-sans">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-sm text-white">
                          {showManualForm ? "⚙️ Manual Calculator Mode (Fallback Simulation Only)" : "🎯 Live Prediction & LightGBM Insights (Primary Model)"}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {showManualForm 
                            ? "Simulate predictions manually via fallback coefficients (NOT the trained LightGBM model)" 
                            : selectedGame 
                              ? `Live LightGBM ML Analysis: ${selectedGame.awayAbbr} @ ${selectedGame.homeAbbr}` 
                              : "Select an active game from the live schedule on the left to inspect variables"
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-[10.5px] font-mono font-bold bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl px-3.5 py-2 transition-all cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={showManualForm}
                            onChange={(e) => {
                              setShowManualForm(e.target.checked);
                            }}
                            className="rounded border-slate-850 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Stats Playground Overlay</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {showManualForm ? (
                    // ⚙️ MODE 1: MANUAL STATS PLAYGROUND FORM
                    <>
                      <form onSubmit={handlePredict} className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                          <div>
                            <h3 className="font-semibold text-xs uppercase font-mono tracking-wider text-slate-400">Custom Matchup Configuration</h3>
                            <p className="text-[11px] text-slate-500">Simulate predictions by fine-tuning starting rosters and team benchmarks</p>
                          </div>
                          {selectedGame ? (
                            <div className="bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-semibold font-mono border border-emerald-500/20">
                              🎯 Hydrated: {selectedGame.awayAbbr} @ {selectedGame.homeAbbr}
                            </div>
                          ) : (
                            <div className="bg-slate-850/80 text-blue-400 px-3 py-1 rounded-full text-[10px] font-semibold font-mono border border-blue-500/10">
                              🛠️ Fallback Simulator Mode
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          {/* Vertical separator */}
                          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-800 -ml-px"></div>

                          {/* 🏠 HOME TEAM COLUMN */}
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-950/40 rounded-xl border border-slate-850">
                              <span className="text-lg">🏠</span>
                              <div className="flex-1">
                                <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider leading-none">Home Team</h3>
                                <p className="text-[10.5px] text-slate-500 leading-tight block">Overall Stadium Environment Advantage</p>
                              </div>
                            </div>

                            {/* Team Picker */}
                            <div className="grid grid-cols-1 gap-2.5">
                              <div>
                                <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Select Home Team</label>
                                <select
                                  value={predictorState.homeAbbr}
                                  onChange={(e) => handleTeamChange('home', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                                >
                                  {Object.entries(teamAbbrToName).map(([abbr, name]) => (
                                    <option key={abbr} value={abbr}>{name} ({abbr})</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Overall Season Win %</label>
                                  <input 
                                    type="number" 
                                    min="0.25" 
                                    max="0.75" 
                                    step="0.005"
                                    value={predictorState.homeTeamWinPct}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeTeamWinPct: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Runs Per Game (RPG)</label>
                                  <input 
                                    type="number" 
                                    min="2.0" 
                                    max="7.0" 
                                    step="0.1"
                                    value={predictorState.homeRunsPG}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeRunsPG: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                              </div>

                              <h4 className="text-[11px] font-mono font-semibold text-slate-400 border-b border-slate-850 pb-1 mt-2">Starting Pitching (SP) Stats</h4>
                              
                              {selectedGame && (
                                <div className="text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-850 text-slate-300 font-medium truncate">
                                  Starter Name: <span className="text-white">{selectedGame.homeStarterName}</span>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Starting Pitcher ERA</label>
                                  <input 
                                    type="number" 
                                    min="1.0" 
                                    max="9.0" 
                                    step="0.05"
                                    value={predictorState.homeStarterERA}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeStarterERA: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Starting Pitcher WHIP</label>
                                  <input 
                                    type="number" 
                                    min="0.6" 
                                    max="2.2" 
                                    step="0.01"
                                    value={predictorState.homeStarterWHIP}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeStarterWHIP: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Strikeout-to-Walk SOBB</label>
                                  <input 
                                    type="number" 
                                    min="0.5" 
                                    max="8.0" 
                                    step="0.1"
                                    value={predictorState.homeStarterSOBB}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeStarterSOBB: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">SP Throwing Hand</label>
                                  <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 h-7 items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => setPredictorState(prev => ({ ...prev, homeStarterHand: 'R' }))}
                                      className={`flex-1 text-[10px] py-1.5 rounded text-center transition-all ${predictorState.homeStarterHand === 'R' ? 'bg-slate-800 text-white font-medium' : 'text-slate-550'}`}
                                    >
                                      Right
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPredictorState(prev => ({ ...prev, homeStarterHand: 'L' }))}
                                      className={`flex-1 text-[10px] py-1.5 rounded text-center transition-all ${predictorState.homeStarterHand === 'L' ? 'bg-slate-800 text-white font-medium' : 'text-slate-550'}`}
                                    >
                                      Left
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <h4 className="text-[11px] font-mono font-semibold text-slate-400 border-b border-slate-850 pb-1 mt-2">Other Team Baselines</h4>
                              
                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Team Batting OPS</label>
                                  <input 
                                    type="number" 
                                    min="0.550" 
                                    max="0.900" 
                                    step="0.005"
                                    value={predictorState.homeBattingOPS}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeBattingOPS: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Bullpen Save Success %</label>
                                  <input 
                                    type="number" 
                                    min="0.30" 
                                    max="0.95" 
                                    step="0.01"
                                    value={predictorState.homeSavePct}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, homeSavePct: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ✈️ AWAY TEAM COLUMN */}
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-950/40 rounded-xl border border-slate-850">
                              <span className="text-lg">✈️</span>
                              <div className="flex-1">
                                <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider leading-none">Away Team</h3>
                                <p className="text-[10.5px] text-slate-500 leading-tight block">Overall Road Travel Pressure</p>
                              </div>
                            </div>

                            {/* Team Picker */}
                            <div className="grid grid-cols-1 gap-2.5">
                              <div>
                                <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Select Away Team</label>
                                <select
                                  value={predictorState.awayAbbr}
                                  onChange={(e) => handleTeamChange('away', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                                >
                                  {Object.entries(teamAbbrToName).map(([abbr, name]) => (
                                    <option key={abbr} value={abbr}>{name} ({abbr})</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Overall Season Win %</label>
                                  <input 
                                    type="number" 
                                    min="0.25" 
                                    max="0.75" 
                                    step="0.005"
                                    value={predictorState.awayTeamWinPct}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awayTeamWinPct: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Runs Per Game (RPG)</label>
                                  <input 
                                    type="number" 
                                    min="2.0" 
                                    max="7.0" 
                                    step="0.1"
                                    value={predictorState.awayRunsPG}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awayRunsPG: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                              </div>

                              <h4 className="text-[11px] font-mono font-semibold text-slate-400 border-b border-slate-850 pb-1 mt-2">Starting Pitching (SP) Stats</h4>
                              
                              {selectedGame && (
                                <div className="text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-850 text-slate-300 font-medium truncate">
                                  Starter Name: <span className="text-white">{selectedGame.awayStarterName}</span>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Starting Pitcher ERA</label>
                                  <input 
                                    type="number" 
                                    min="1.0" 
                                    max="9.0" 
                                    step="0.05"
                                    value={predictorState.awayStarterERA}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awayStarterERA: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Starting Pitcher WHIP</label>
                                  <input 
                                    type="number" 
                                    min="0.6" 
                                    max="2.2" 
                                    step="0.01"
                                    value={predictorState.awayStarterWHIP}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awayStarterWHIP: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Strikeout-to-Walk SOBB</label>
                                  <input 
                                    type="number" 
                                    min="0.5" 
                                    max="8.0" 
                                    step="0.1"
                                    value={predictorState.awayStarterSOBB}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awayStarterSOBB: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">SP Throwing Hand</label>
                                  <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 h-7 items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => setPredictorState(prev => ({ ...prev, awayStarterHand: 'R' }))}
                                      className={`flex-1 text-[10px] py-1.5 rounded text-center transition-all ${predictorState.awayStarterHand === 'R' ? 'bg-slate-800 text-white font-medium' : 'text-slate-550'}`}
                                    >
                                      Right
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPredictorState(prev => ({ ...prev, awayStarterHand: 'L' }))}
                                      className={`flex-1 text-[10px] py-1.5 rounded text-center transition-all ${predictorState.awayStarterHand === 'L' ? 'bg-slate-800 text-white font-medium' : 'text-slate-550'}`}
                                    >
                                      Left
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <h4 className="text-[11px] font-mono font-semibold text-slate-400 border-b border-slate-850 pb-1 mt-2">Other Team Baselines</h4>
                              
                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Team Batting OPS</label>
                                  <input 
                                    type="number" 
                                    min="0.550" 
                                    max="0.900" 
                                    step="0.005"
                                    value={predictorState.awayBattingOPS}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awayBattingOPS: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10.5px] font-mono text-slate-400 block mb-1">Bullpen Save Success %</label>
                                  <input 
                                    type="number" 
                                    min="0.30" 
                                    max="0.95" 
                                    step="0.01"
                                    value={predictorState.awaySavePct}
                                    onChange={(e) => setPredictorState(prev => ({ ...prev, awaySavePct: parseFloat(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-slate-850 pt-5">
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <Shield className="w-4 h-4 text-emerald-400" /> Null safety: backfills fallback averages as needed.
                          </div>
                          <div className="flex gap-3 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setPredictorState({
                                  homeAbbr: 'LAD', awayAbbr: 'NYY',
                                  homeTeamWinPct: 0.58, awayTeamWinPct: 0.55,
                                  homeRunsPG: 4.8, awayRunsPG: 4.6,
                                  homePitchingERA: 3.8, awayPitchingERA: 4.0,
                                  homePitchingWHIP: 1.22, awayPitchingWHIP: 1.25,
                                  homeBattingOPS: 0.765, awayBattingOPS: 0.750,
                                  homeStarterERA: 3.65, awayStarterERA: 3.85,
                                  homeStarterWHIP: 1.18, awayStarterWHIP: 1.21,
                                  homeStarterSOBB: 2.8, awayStarterSOBB: 2.6,
                                  homeStarterHand: 'R', awayStarterHand: 'R',
                                  homeSavePct: 0.72, awaySavePct: 0.70
                                });
                                setSelectedGame(null);
                                setPredictResult(null);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all hover:bg-slate-850"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                            </button>
                            <button
                              type="submit"
                              disabled={predicting}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs shadow-md shadow-emerald-500/10 cursor-pointer hover:shadow-emerald-500/15 disabled:opacity-50 transition-all border border-emerald-400/20"
                            >
                              {predicting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950 text-slate-950" />}
                              RUN MODEL PREDICTION
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Prediction Output Results Card under form in Playground mode */}
                      <AnimatePresence>
                        {predictResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-slate-900 border border-emerald-500/10 rounded-2xl p-6 shadow-xl shadow-emerald-950/5 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500"></div>

                            <div className="flex flex-col gap-5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">🏆</span>
                                <div>
                                  <h3 className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">Playground Prediction Outcome</h3>
                                  <p className="text-xs text-slate-400 font-sans">Classified probabilities derived from custom input parameters.</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 border-y border-slate-850">
                                <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${predictResult.prediction === 'HOME' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-950/40 border-slate-850'}`}>
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-semibold text-slate-300">🏠 {teamAbbrToName[predictorState.homeAbbr]}</span>
                                    {predictResult.prediction === 'HOME' && (
                                      <span className="text-[10px] font-bold uppercase font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md leading-none">PREDICTED WINNER</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-3xl font-extrabold font-mono text-white leading-none">{(predictResult.homeWinProb * 100).toFixed(1)}%</span>
                                    <span className="text-xs text-slate-400">chance</span>
                                  </div>
                                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mt-3 border border-slate-850/50">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                      style={{ width: `${predictResult.homeWinProb * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${predictResult.prediction === 'AWAY' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-950/40 border-slate-850'}`}>
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-semibold text-slate-300">✈️ {teamAbbrToName[predictorState.awayAbbr]}</span>
                                    {predictResult.prediction === 'AWAY' && (
                                      <span className="text-[10px] font-bold uppercase font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md leading-none">PREDICTED WINNER</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-3xl font-extrabold font-mono text-white leading-none">{(predictResult.awayWinProb * 100).toFixed(1)}%</span>
                                    <span className="text-xs text-slate-400">chance</span>
                                  </div>
                                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mt-3 border border-slate-850/50">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                      style={{ width: `${predictResult.awayWinProb * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-400 font-mono">
                                <span className="flex items-center gap-1.2"><ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> Model includes home advantage weight correction.</span>
                                <span className="text-[11px] text-slate-500">Classification precision: ~{(metrics?.precision ? metrics.precision * 100 : 54).toFixed(1)}%</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    // 🎯 MODE 2: AUTOMATED LIVE PREDICTION INSIGHTS & EXPLANATORY DASHBOARD
                    <>
                      {!selectedGame ? (
                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                          </div>
                          <h3 className="font-semibold text-sm text-white">Select Matchup to Inspect</h3>
                          <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-sans">
                            Choose from any scheduled or in-progress match in today's live MLB slate on the left to load real rosters, run ML matrices, and analyze feature-level weights.
                          </p>
                        </div>
                      ) : predicting && !predictResult ? (
                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                          <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                          <h3 className="font-semibold text-xs uppercase font-mono tracking-wider text-white">Running Logistic Coefficients Analysis...</h3>
                          <p className="text-xs text-slate-500 font-mono">Formulating 7-feature differences against historically fitted vectors</p>
                        </div>
                      ) : (
                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
                          {/* Broadcast ticket */}
                          <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex items-center justify-between gap-4 font-sans shadow-inner">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">✈️</span>
                              <div>
                                <span className="text-base font-bold text-white font-mono">{selectedGame.awayAbbr}</span>
                                <span className="text-xs text-slate-450 block truncate max-w-[140px]">{teamAbbrToName[selectedGame.awayAbbr] || selectedGame.awayName}</span>
                              </div>
                            </div>
                            <div className="text-center font-mono font-bold text-slate-500 text-xs self-center px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                              VS
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className="text-base font-bold text-white font-mono">{selectedGame.homeAbbr}</span>
                                <span className="text-xs text-slate-450 block truncate max-w-[140px]">{teamAbbrToName[selectedGame.homeAbbr] || selectedGame.homeName}</span>
                              </div>
                              <span className="text-2xl">🏠</span>
                            </div>
                          </div>

                          {/* Consensus Meter */}
                          {predictResult && (
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col gap-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850/60 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">Model Prediction Preference</span>
                                </div>
                                <div className="text-xs font-mono text-slate-400">
                                  Model Confidence: <strong className="text-emerald-400 font-bold">{(Math.max(predictResult.homeWinProb, predictResult.awayWinProb) * 100).toFixed(1)}%</strong> next to preference
                                </div>
                              </div>

                              {/* Split prob bar */}
                              <div className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-baseline text-xs font-mono">
                                  <span className={predictResult.prediction === 'AWAY' ? "text-emerald-450 font-extrabold" : "text-slate-500 font-medium"}>
                                    ✈️ {selectedGame.awayAbbr} {(predictResult.awayWinProb * 100).toFixed(1)}% Win Chance
                                  </span>
                                  <span className={predictResult.prediction === 'HOME' ? "text-emerald-450 font-extrabold" : "text-slate-500 font-medium"}>
                                    🏠 {selectedGame.homeAbbr} {(predictResult.homeWinProb * 100).toFixed(1)}% Win Chance
                                  </span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden flex border border-slate-800/80 p-0.5">
                                  <div 
                                    className={`h-full rounded-l transition-all duration-300 ${predictResult.prediction === 'AWAY' ? 'bg-gradient-to-r from-teal-500 to-emerald-450' : 'bg-slate-800'}`}
                                    style={{ width: `${predictResult.awayWinProb * 100}%` }}
                                  ></div>
                                  <div 
                                    className={`h-full rounded-r transition-all duration-300 ${predictResult.prediction === 'HOME' ? 'bg-gradient-to-r from-emerald-450 to-teal-500' : 'bg-slate-800'}`}
                                    style={{ width: `${predictResult.homeWinProb * 100}%` }}
                                  ></div>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 text-xs text-slate-350 leading-snug font-sans flex items-center gap-2">
                                  <span className="text-lg">🔥</span>
                                  <span>
                                    Model predicts <strong className="text-white">{(predictResult.prediction === 'HOME' ? selectedGame.homeAbbr : selectedGame.awayAbbr)}</strong> wins this game with <strong className="text-emerald-400">{(Math.max(predictResult.homeWinProb, predictResult.awayWinProb) * 100).toFixed(1)}% confidence</strong> based on seasonal variables.
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Starters Side-By-Side Comparison Card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex flex-col gap-3 font-sans">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550 border-b border-slate-900 pb-1.5 block">✈️ {selectedGame.awayAbbr} Starting Pitcher</span>
                              <div>
                                <h4 className="text-sm font-semibold text-white truncate leading-none mb-1">{selectedGame.awayStarterName}</h4>
                                <p className="text-[9.5px] text-slate-500 font-mono tracking-wide uppercase">Throwing Arm: {selectedGame.awayStarterHand}HP</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5 mt-1">
                                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
                                  <span className="text-[9px] font-mono text-slate-500 block leading-none mb-1">Season ERA</span>
                                  <span className="text-xs font-mono font-bold text-slate-200">{selectedGame.awayStarterERA.toFixed(2)}</span>
                                </div>
                                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
                                  <span className="text-[9px] font-mono text-slate-500 block leading-none mb-1">Season WHIP</span>
                                  <span className="text-xs font-mono font-bold text-slate-200">{selectedGame.awayStarterWHIP.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl flex flex-col gap-3 font-sans">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-550 border-b border-slate-900 pb-1.5 block">🏠 {selectedGame.homeAbbr} Starting Pitcher</span>
                              <div>
                                <h4 className="text-sm font-semibold text-white truncate leading-none mb-1">{selectedGame.homeStarterName}</h4>
                                <p className="text-[9.5px] text-slate-500 font-mono tracking-wide uppercase">Throwing Arm: {selectedGame.homeStarterHand}HP</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5 mt-1">
                                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
                                  <span className="text-[9px] font-mono text-slate-500 block leading-none mb-1">Season ERA</span>
                                  <span className="text-xs font-mono font-bold text-slate-200">{selectedGame.homeStarterERA.toFixed(2)}</span>
                                </div>
                                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 text-center">
                                  <span className="text-[9px] font-mono text-slate-500 block leading-none mb-1">Season WHIP</span>
                                  <span className="text-xs font-mono font-bold text-slate-200">{selectedGame.homeStarterWHIP.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Model Factor attributions */}
                          {predictResult?.contributions && (
                            <div className="flex flex-col gap-4 mt-2">
                              <div className="flex items-center gap-2 border-t border-slate-850 pt-5">
                                <Cpu className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-xs font-mono uppercase font-semibold text-emerald-400">Model Feature Contributions Decomposition</h3>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                How each calculated feature difference is scaled by variables and influences the final log-odds win probability:
                              </p>

                              <div className="flex flex-col gap-3.5">
                                {predictResult.contributions.map((item, idx) => {
                                  const contribution = item.contribution;
                                  const favorsHome = contribution > 0;
                                  // Find out if this contribution aligns with what the model actually chose
                                  const favorsPredicted = (predictResult.prediction === 'HOME' && contribution > 0) || (predictResult.prediction === 'AWAY' && contribution < 0);
                                  
                                  return (
                                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-2 hover:border-slate-800 transition-all">
                                      <div className="flex justify-between items-start gap-1 font-sans">
                                        <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                                        <span className="text-[10.5px] font-mono text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                          Diff: {item.rawValue >= 0 ? `+${item.rawValue.toFixed(3)}` : item.rawValue.toFixed(3)}
                                        </span>
                                      </div>

                                      {/* Bi-directional split bar representation */}
                                      <div className="relative h-2 bg-slate-900 rounded-full border border-slate-850 overflow-hidden">
                                        {/* Baseline centered line */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 z-10"></div>
                                        {/* Filled bar stretching away from center */}
                                        <div 
                                          className={`absolute top-0 bottom-0 h-full rounded transition-all duration-300 ${favorsPredicted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'}`}
                                          style={{
                                            left: favorsHome ? '50%' : 'auto',
                                            right: !favorsHome ? '50%' : 'auto',
                                            width: `${Math.min(Math.abs(contribution) * 100, 50)}%`
                                          }}
                                        ></div>
                                      </div>

                                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-0.5">
                                        <span>Beta Weights Multiplier: <strong className="text-slate-400 font-medium">β = {item.weight >= 0 ? '+' : ''}{item.weight.toFixed(3)}</strong></span>
                                        <span className={favorsHome ? 'text-emerald-400 font-semibold' : 'text-blue-400 font-semibold'}>
                                          {favorsHome ? '🏠 Favors Home' : '✈️ Favors Away'} ({contribution >= 0 ? '+' : ''}{(contribution * 100).toFixed(1)}%)
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Intercept details */}
                              <div className="border-t border-slate-850 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] font-mono text-slate-500 leading-tight">
                                <span>Model Standard Intercept Constant (Bias): <strong>β₀ = {predictResult.bias?.toFixed(4) || '0.0000'}</strong></span>
                                <span className="text-slate-600">Model formula: σ(β₀ + ∑ βᵢxᵢ)</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'performance' && metrics && (
              <motion.div 
                key="performance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                {/* Metrics top metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-[11.5px] font-mono text-emerald-400 font-semibold tracking-wider">OUT-OF-SAMPLE ACCURACY</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold font-mono text-white">{(metrics.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 leading-tight">Evaluated entirely on the completed 12,168 games from the 2021-2025 Holdout Seasons.</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-[11.5px] font-mono text-emerald-400 font-semibold tracking-wider font-medium">TRAINING POPULATION</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold font-mono text-white">{metrics.totalTrainingGames.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">games</span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 leading-tight">Complete regular season games compiled chronologically from 2010 to 2020.</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-[11.5px] font-mono text-emerald-400 font-semibold tracking-wider">MODEL F1 MATCH SCORE</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold font-mono text-white">{(metrics.f1Score * 100).toFixed(1)}%</span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 leading-tight">Harmonic mean representing balanced prediction capacity on both Home & Road teams.</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-[11.5px] font-mono text-emerald-400 font-semibold tracking-wider">DATA ISOLATION STATUS</span>
                    <div className="flex items-baseline gap-2 text-emerald-400">
                      <span className="text-xl font-extrabold font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">SECURED</span>
                    </div>
                    <span className="text-[10.5px] text-slate-400 leading-tight">Zero stats from 2021-2025 were leaked during weight compilation, ensuring true diagnostic validity.</span>
                  </div>
                </div>

                {/* 📊 TOP 3 BACKTEST VERSIONS COMPARISON BREAKDOWN */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <h3 className="font-semibold text-sm text-white">Diagnostic Backtest & Holdout Comparison (2021 - 2025 Regular Seasons)</h3>
                    </div>
                    <p className="text-xs text-slate-400">Comparing the leading iterations of our Predictive Machine Learning Model. We prioritize <strong>out-of-sample consistency</strong> (the lowest standard deviation across disconnected regular seasons) to completely defend against overfitting.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* VERSION 1 */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border-2 border-emerald-500/20 relative overflow-hidden flex flex-col gap-4">
                      {/* Badge */}
                      <span className="absolute top-0 right-0 text-[9.5px] font-bold uppercase font-mono bg-emerald-500 text-slate-950 px-3 py-1 rounded-bl-xl shadow-md">🌟 Primary Model</span>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wider font-bold">VERSION 1 (LIGHTGBM PREGAME)</span>
                        <div className="flex items-baseline gap-1.5 border-b border-slate-850 pb-2">
                          <span className="text-2xl font-extrabold font-mono text-white">60.77%</span>
                          <span className="text-xs text-slate-400 font-mono">Mean Accuracy</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                        <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-850">
                          <span className="text-slate-400 font-mono">Consistency (Std Dev):</span>
                          <span className="font-bold text-white font-mono">0.94% (Most Stable)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2021 Out-of-sample Accuracy:</span>
                          <span className="font-bold text-white font-mono">60.36%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2022 Out-of-sample Accuracy:</span>
                          <span className="font-bold text-white font-mono">62.57%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2023 Out-of-sample Accuracy:</span>
                          <span className="font-bold text-white font-mono">60.80%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2024 Out-of-sample Accuracy:</span>
                          <span className="font-bold text-white font-mono">59.95%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2025 Out-of-sample Accuracy:</span>
                          <span className="font-bold text-emerald-400 font-mono font-bold">60.20%</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-850 pt-3 flex flex-col gap-1.5 text-[10.5px] leading-relaxed text-slate-400">
                        <span className="font-semibold text-slate-300 font-mono flex items-center gap-1">🛠️ FEATURE ARCHITECTURE:</span>
                        Extracted absolute full 12 features from teams and starters. Yields high raw peak strength and most resilient performance across subsequent holdout years.
                      </div>
                    </div>

                    {/* VERSION 4 */}
                    <div className="bg-slate-950/20 p-5 rounded-2xl border border-slate-850 relative overflow-hidden flex flex-col gap-4">
                      <span className="absolute top-0 right-0 text-[9.5px] font-bold uppercase font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-bl-xl shadow-sm">⚠️ Fallback Model</span>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider font-bold">VERSION 4 (MANUAL REGRESSION FALLBACK)</span>
                        <div className="flex items-baseline gap-1.5 border-b border-slate-850 pb-2">
                          <span className="text-2xl font-extrabold font-mono text-white">60.54%</span>
                          <span className="text-xs text-slate-400 font-mono">Mean Accuracy</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                        <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-850">
                          <span className="text-slate-400 font-mono">Consistency (Std Dev):</span>
                          <span className="font-semibold text-white font-mono">1.01%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2021 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">60.48%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2022 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">62.16%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2023 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">60.80%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2024 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">60.24%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2025 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-slate-350 font-mono">59.00%</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-850 pt-3 flex flex-col gap-1.5 text-[10.5px] leading-relaxed text-slate-400">
                        <span className="font-semibold text-slate-300 font-mono flex items-center gap-1">🛠️ FEATURE ARCHITECTURE:</span>
                        7 physical core parameters: Team Seasonal Strength Diff, Game Run Differential, Starter ERA Diff, Starter WHIP Diff, Starter SO/BB Ratio, Bullpen Save %, and Home Bias baseline. All coefficients match physical direction.
                      </div>
                    </div>

                    {/* VERSION 3 */}
                    <div className="bg-slate-950/20 p-5 rounded-2xl border border-slate-850 relative overflow-hidden flex flex-col gap-4">
                      <span className="absolute top-0 right-0 text-[10px] font-semibold text-slate-500 bg-slate-900 px-3 py-1 rounded-bl-xl border-l border-b border-slate-800">RANK #3</span>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider font-bold">VERSION 3 (LOW COLLINEARITY)</span>
                        <div className="flex items-baseline gap-1.5 border-b border-slate-850 pb-2">
                          <span className="text-2xl font-extrabold font-mono text-white">60.53%</span>
                          <span className="text-xs text-slate-400 font-mono">Mean Accuracy</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                        <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-850">
                          <span className="text-slate-400 font-mono">Consistency (Std Dev):</span>
                          <span className="font-semibold text-white font-mono">0.91% (Lowest Std Dev)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2021 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">60.16%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2022 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">62.11%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2023 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">60.92%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2024 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-white font-mono">59.83%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">2025 Out-of-sample Accuracy:</span>
                          <span className="font-semibold text-slate-300 font-mono">59.62%</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-850 pt-3 flex flex-col gap-1.5 text-[10.5px] leading-relaxed text-slate-400">
                        <span className="font-semibold text-slate-300 font-mono flex items-center gap-1">🛠️ FEATURE ARCHITECTURE:</span>
                        Aimed to reduce multi-collinear factors by replacing batting/pitching stats with Team Quality Starts (QS) ratio, run indicators, and line splits. Excellent performance of ~60.51% mean accuracy.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Feature importances list */}
                  <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-emerald-400 w-4 h-4" />
                      <h3 className="font-semibold text-sm text-white">Mathematical Contribution Weights</h3>
                    </div>
                    <p className="text-xs text-slate-400 -mt-2 leading-relaxed">The relative importance calculated from the standardized Logistic coefs. Metrics like starter effectiveness and bullpen save percentage are heavily prioritized.</p>
                    
                    <div className="flex flex-col gap-3.5 mt-2">
                      {metrics.featureImportances.map((item, index) => (
                        <div key={item.metric} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                            <span className="truncate max-w-[280px] sm:max-w-none text-[11.5px]">{index + 1}. {item.metric}</span>
                            <span className="font-semibold text-emerald-400 font-bold">{(item.importance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-850">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${item.importance * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: holdout classification reports */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Layers className="text-emerald-400 w-4 h-4" />
                        <h3 className="font-semibold text-sm text-white">Detailed Holdout Statistics</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">Standard Classification details across the {metrics.totalTestingGames.toLocaleString()} games evaluated in the 2021-2025 holdout seasons.</p>
                      
                      <div className="mt-2 border border-slate-800 rounded-xl overflow-hidden text-xs">
                        {/* Header */}
                        <div className="grid grid-cols-4 bg-slate-950 p-2.5 font-bold text-slate-400 border-b border-slate-800 font-mono">
                          <span>Target</span>
                          <span className="text-right">Prec</span>
                          <span className="text-right">Rec</span>
                          <span className="text-right">Supp</span>
                        </div>
                        {/* Home Wins Row */}
                        <div className="grid grid-cols-4 p-2.5 border-b border-slate-850/60 font-mono text-slate-300">
                          <span className="font-semibold font-sans text-white">Home Win</span>
                          <span className="text-right">{(metrics.classificationReport.homeWins.precision * 100).toFixed(1)}%</span>
                          <span className="text-right">{(metrics.classificationReport.homeWins.recall * 100).toFixed(1)}%</span>
                          <span className="text-right text-slate-400">{metrics.classificationReport.homeWins.support}</span>
                        </div>
                        {/* Away Wins Row */}
                        <div className="grid grid-cols-4 p-2.5 font-mono text-slate-300">
                          <span className="font-semibold font-sans text-white">Away Win</span>
                          <span className="text-right">{(metrics.classificationReport.awayWins.precision * 100).toFixed(1)}%</span>
                          <span className="text-right">{(metrics.classificationReport.awayWins.recall * 100).toFixed(1)}%</span>
                          <span className="text-right text-slate-400">{metrics.classificationReport.awayWins.support}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 border border-slate-850 class-border rounded-xl flex flex-col gap-2 text-[10.5px] leading-relaxed text-slate-400">
                        <span className="font-semibold text-slate-300 font-mono flex items-center gap-1">💡 MODEL DIAGNOSTIC INTERPRETATION</span>
                        The primary LightGBM model exhibits exceptionally balanced precision on Home wins vs Away wins across all holdout years, achieving a consistent out-of-sample accuracy with zero same-season data leakage.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div 
                key="export"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col gap-5"
              >
                <div className="flex flex-col md:flex-row gap-5 border-b border-slate-850 pb-5">
                  {/* Zip Export Card */}
                  <div id="zip-export" className="flex-1 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20 mt-0.5">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white font-mono tracking-wide">ZIP DATASET EXPORT ARCHIVE</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Download a single aggregated <span className="font-mono text-emerald-400">mlb_data_export.zip</span> archive containing the complete MLB Games dataset, Pitchers stats profile database, and the workspace build state <span className="font-mono text-emerald-400">package-lock.json</span>.
                        </p>
                      </div>
                    </div>
                    <a
                      href="/api/download-zip"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono font-bold rounded-xl bg-emerald-505 bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-md shadow-emerald-950/20"
                    >
                      <Download className="w-4 h-4" />
                      Download Data Export Archive (.zip)
                    </a>
                  </div>

                  {/* Hugging Face Copy Card */}
                  <div id="hf-export" className="flex-1 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500/10 p-2.5 rounded-xl text-orange-400 border border-orange-500/20 mt-0.5">
                        <Copy className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white font-mono tracking-wide">HF STREAMLIT EMBEDDINGS</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Export the trained classifier model parameters, scale mechanisms, and real-time inference hooks directly to Streamlit on Hugging Face.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 font-mono text-xs rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition-all hover:bg-slate-750 cursor-pointer"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Copied Successfully!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Python Apps Code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-850 text-xs leading-relaxed text-slate-300 flex flex-col gap-2">
                  <span className="font-semibold text-slate-100 font-mono">📋 STEP-BY-STEP INTEGRATION INSTRUCTIONS</span>
                  <ol className="list-decimal pl-5 flex flex-col gap-1.5">
                    <li>Create or open your Hugging Face Space (SDK set to **Streamlit**).</li>
                    <li>Inside your space repository, open the file <span className="font-mono text-emerald-400">src/streamlit_app.py</span>.</li>
                    <li>Click <strong>Copy Python Code</strong> on this panel and paste it into Hugging Face.</li>
                    <li>Add the standard libraries <span className="font-mono text-emerald-300">streamlit, pandas, numpy, scikit-learn, requests</span> inside your <span className="font-mono text-emerald-400">requirements.txt</span> file.</li>
                    <li>Hugging Face will automatically compile, fetch this database from our API server dynamically, and render the identical secure model setup!</li>
                  </ol>
                </div>

                <div className="relative mt-2">
                  <pre className="p-4 bg-slate-950 border border-slate-850/80 rounded-xl overflow-x-auto text-[11px] leading-5 text-emerald-300 font-mono h-[350px] scrollbars">
                    {pythonCode}
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none rounded-b-xl"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-slate-850 bg-slate-900/10 py-5 text-center mt-auto">
        <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
          MLB Predictive Engine &copy; 2026. Data sourced in 100% real-time from official MLB Stats API & datasets.
        </p>
      </footer>
    </div>
  );
}
