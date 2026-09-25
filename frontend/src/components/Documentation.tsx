import { useState } from 'react';
import './Documentation.css';
import { BookOpen, Layout, Sparkles, X, CheckSquare, MessageSquare, Clock } from 'lucide-react';

const Demos: Record<string, any> = {
  dashboard: {
    title: 'Dashboard Demo',
    description: 'The dashboard gives you a quick overview of your upcoming trip and laundry stats.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-countdown"><Clock size={16}/> 3 Days Until Going Home 🏠</div>
        <div className="demo-laundry-item"><span>Clean Clothes</span> <span className="demo-badge bad-green">5 Ready</span></div>
        <div className="demo-laundry-item"><span>Dirty Clothes</span> <span className="demo-badge bad-red">3 To Wash</span></div>
      </div>
    )
  },
  plantrip: {
    title: 'Plan Trip Demo',
    description: 'Create a trip, tick items as you pack, then Save your packing list.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-check-item"><CheckSquare size={16} color="var(--accent)"/> Laptop ✅ PACKED</div>
        <div className="demo-check-item"><CheckSquare size={16} color="var(--accent)"/> Undergarments ✅ PACKED</div>
        <div className="demo-check-item"><div className="demo-empty-check"></div> Phone Charger — TO PACK</div>
        <div style={{marginTop: '10px', background: 'var(--accent)', color: '#000', borderRadius: '8px', padding: '6px 12px', fontWeight: 700, fontSize: '13px', textAlign: 'center'}}>✅ Save Packing List (2/3 packed)</div>
      </div>
    )
  },
  returning: {
    title: 'Returning to PG Demo',
    description: 'When you create a "Returning to PG" trip, items you packed (✅ ticked) in the previous "Going Home" trip are automatically suggested.',
    mockup: (
      <div className="demo-mockup">
        <div style={{fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px'}}>📦 Auto-carried from last Going Home trip:</div>
        <div className="demo-check-item"><div className="demo-empty-check"></div> Laptop</div>
        <div className="demo-check-item"><div className="demo-empty-check"></div> Undergarments</div>
        <div className="demo-check-item"><div className="demo-empty-check"></div> Phone Charger</div>
      </div>
    )
  },
  laundry: {
    title: 'Laundry Tracker Demo',
    description: 'Track your clothes — mark them clean or dirty. Dirty clothes appear in "Going Home" checklist, clean ones appear in "Returning" checklist.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-laundry-item"><span>Red T-Shirt</span> <span className="demo-badge bad-red">Dirty 🧺</span></div>
        <div className="demo-laundry-item"><span>Black Jeans</span> <span className="demo-badge bad-green">Clean ✅</span></div>
        <div className="demo-laundry-item"><span>Undergarments</span> <span className="demo-badge bad-red">Dirty 🧺</span></div>
      </div>
    )
  },
  undo: {
    title: 'Undo a Tick Demo',
    description: 'Accidentally ticked an item? Just click it again to untick (undo). Items toggle between Packed ✅ and To Pack ⬜ on every click.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-check-item" style={{opacity: 0.6}}><CheckSquare size={16} color="var(--accent)"/> Laptop → Click again → ⬜ Unticked</div>
        <div style={{fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px'}}>💡 Tip: Click any ticked item to undo the tick</div>
      </div>
    )
  },
  ai: {
    title: 'AI Smart Packing Demo',
    description: 'Describe your trip in Malayalam, Manglish, or English. AI will auto-detect trip type, date, and suggest items.',
    mockup: (
      <div className="demo-mockup">
        <div className="demo-chat-user">Njan naalthe veedu pokunnu, mazha aanu</div>
        <div className="demo-chat-ai">✨ Detected: Going Home | Tomorrow | Added: Umbrella ☂️, Raincoat, Clothes for 1 day, Phone Charger...</div>
      </div>
    )
  }
};

const Documentation = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  return (
    <div className="docs-container">
      <div className="docs-header">
        <BookOpen className="docs-icon" size={40} />
        <h1>Project Guide - Home Trip Mode</h1>
        <p>Complete User Guide for the Home Trip Mode app — for PG students traveling home 🏠</p>
      </div>

      <div className="docs-content">

        {/* Section 1 - How it works */}
        <section className="docs-section">
          <h2><Layout className="section-icon" /> How does this project work?</h2>
          <p>
            <strong>Home Trip Mode</strong> helps PG students plan trips home and back, pack smartly,
            track expenses, and never forget an item — powered by Gemini AI.
          </p>
          <div className="docs-features">
            <div className="feature-card clickable" onClick={() => setActiveDemo('dashboard')}>
              <h3>📊 Dashboard</h3>
              <p>See your upcoming trip countdown, laundry stats (clean vs dirty clothes), and quick navigation to all features.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('plantrip')}>
              <h3>✈️ Plan Trip (Packing Checklist)</h3>
              <p>Create a "Going Home" or "Returning to PG" trip. Tick items as you pack. Save the list when done. All ticked items are remembered.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('returning')}>
              <h3>🔙 Smart Return Trip</h3>
              <p>When you create a "Returning to PG" trip, items you ticked (✅) in the previous "Going Home" trip are automatically added to your new checklist.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('laundry')}>
              <h3>👕 Laundry Tracker</h3>
              <p>Add your clothes and mark them clean or dirty. Dirty clothes auto-appear in "Going Home" packing list. Clean clothes auto-appear in "Returning" list.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('undo')}>
              <h3>↩️ Undo a Tick</h3>
              <p>Accidentally ticked an item? Simply click it again to untick (undo). Items toggle between ✅ Packed and ⬜ To Pack on every click — no separate undo button needed.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
          </div>
        </section>

        {/* Section 2 - Full Flow */}
        <section className="docs-section">
          <h2><CheckSquare className="section-icon" /> Full Trip Flow (Step by Step)</h2>
          <div className="docs-features">
            <div className="feature-card">
              <h3>Step 1 — Going Home 🏠</h3>
              <p>
                1. Go to <strong>Plan Trip</strong><br/>
                2. Choose <strong>"Going Home"</strong><br/>
                3. Tick all items you are packing<br/>
                4. Click <strong>"Save Packing List"</strong><br/>
                5. Optionally share via WhatsApp 📲
              </p>
            </div>
            <div className="feature-card">
              <h3>Step 2 — At Home</h3>
              <p>
                1. Go to <strong>Laundry Tracker</strong><br/>
                2. Mark your clothes as <strong>Dirty</strong> after wearing<br/>
                3. After washing, mark them as <strong>Clean</strong><br/>
                4. Track your expenses in the <strong>Expenses tab</strong>
              </p>
            </div>
            <div className="feature-card">
              <h3>Step 3 — Returning to PG 🏢</h3>
              <p>
                1. Go to <strong>Plan Trip</strong><br/>
                2. Choose <strong>"Returning to PG"</strong><br/>
                3. Items from your "Going Home" trip are <strong>auto-added</strong><br/>
                4. Tick and Save as usual
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 - AI */}
        <section className="docs-section">
          <h2><Sparkles className="section-icon" /> AI Smart Packing Assistant</h2>
          <p>Use the AI text box in Plan Trip to describe your trip. AI will auto-create the trip and checklist for you.</p>
          <div className="docs-features">
            <div className="feature-card clickable" onClick={() => setActiveDemo('ai')}>
              <h3>Malayalam / Manglish Support</h3>
              <p>Type in any language: <em>"Njan naalthe veedu pokunnu, mazha aanu"</em> — AI understands and suggests umbrella, raincoat, etc.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('ai')}>
              <h3>Auto Trip Detection</h3>
              <p>AI detects trip type (Going Home / Returning), travel date, and extracts items from your text automatically.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
            <div className="feature-card clickable" onClick={() => setActiveDemo('ai')}>
              <h3>Smart Item Suggestions</h3>
              <p>Mentions rain? → Adds Umbrella. Mentions 3 days? → Adds "Clothes for 3 days". Train trip? → Adds snacks, water bottle.</p>
              <div className="card-hint">Click to see demo</div>
            </div>
          </div>
        </section>

        {/* Section 4 - Tips */}
        <section className="docs-section">
          <h2><MessageSquare className="section-icon" /> Tips & Tricks</h2>
          <div className="docs-features">
            <div className="feature-card">
              <h3>💡 Always tick items before saving</h3>
              <p>Only ticked (✅) items are carried over to the "Returning to PG" trip checklist. So make sure to tick everything you pack!</p>
            </div>
            <div className="feature-card">
              <h3>💡 Use the All Items filter</h3>
              <p>The "🎒 All Items" filter tab shows every item across all categories. Use category tabs (Clothes, Electronics, Essentials) to focus on one type.</p>
            </div>
            <div className="feature-card">
              <h3>💡 Undo is just a re-click</h3>
              <p>Clicked an item by mistake? Just click it again to untick. No separate undo button — every click toggles the state.</p>
            </div>
          </div>
        </section>

      </div>

      {/* Demo Modal */}
      {activeDemo && Demos[activeDemo] && (
        <div className="demo-modal-overlay" onClick={() => setActiveDemo(null)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="demo-close-btn" onClick={() => setActiveDemo(null)}>
              <X size={24} />
            </button>
            <div className="demo-modal-header">
              <h2>{Demos[activeDemo].title}</h2>
              <p>{Demos[activeDemo].description}</p>
            </div>
            <div className="demo-modal-body">
              {Demos[activeDemo].mockup}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documentation;
