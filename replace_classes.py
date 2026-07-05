from pathlib import Path


files = [
    "src/components/UnitConverter.jsx",
    "src/components/MassBalance.jsx",
    "src/components/EnergyBalance.jsx",
    "src/components/Thermodynamics.jsx",
    "src/components/ReactionEng.jsx",
    "src/components/AICompanion.jsx",
    "src/components/CalculatorHub.jsx"
]


replace_map = {

    'className="input"':
    'className="field-input"',


    'className="select"':
    'className="field-select"',


    'className="label"':
    'className="field-label"',


    'className="btn btn-primary"':
    'className="btn btn-accent"',


    'className="btn btn-secondary"':
    'className="btn btn-ghost"',


    'className="result-box"':
    'className="result-panel"',


    'className="result-label"':
    'className="result-eyebrow"',


    'className="result-value"':
    'className="result-big"',


    'className="formula-box"':
    'className="formula-block"',


    'className="info-box"':
    'className="info-block"',


    'className="info-box-label"':
    'className="info-block-label"',


    'className="info-box-text"':
    'className="info-block-text"',


    'className="tabs"':
    'className="os-tabs"',


    'className="tab"':
    'className="os-tab"',


    'className="grid-2"':
    'className="g2"',


    'className="grid-3"':
    'className="g3"',


    'className="grid-4"':
    'className="g4"',


    'className="res-item"':
    'className="res-cell"',


    'className="res-item-label"':
    'className="res-cell-label"',


    'className="res-item-val"':
    'className="res-cell-val"',


    'className="res-item-unit"':
    'className="res-cell-unit"',
}



for file in files:

    path = Path(file)


    if path.exists():

        content = path.read_text(encoding="utf-8")


        for old,new in replace_map.items():
            content = content.replace(old,new)


        path.write_text(content, encoding="utf-8")


        print("✅ Updated:", file)

    else:

        print("❌ Tidak ditemukan:", file)



print("\n🚀 DESIGN SYSTEM MIGRATION SELESAI")