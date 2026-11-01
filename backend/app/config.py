import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Database settings
DB_PATH = os.environ.get("DATABASE_PATH", str(BASE_DIR / "data" / "elexon_jan2026.db"))

# Elexon BMRS API settings
ELEXON_BASE_URL = os.environ.get("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
FUELHH_ENDPOINT = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_ENDPOINT = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

# Default UK Day-Ahead Market Parameters
# UK Day-Ahead auctions (e.g. EPEX SPOT UK Half-Hour & Hourly, Nord Pool GB)
# Gate closure cutoff is typically 11:00 or 12:00 GMT on D-1.
DEFAULT_GATE_CLOSURE_HOUR = 11  # 11:00 UTC on D-1
DEFAULT_BASELINE_DEMAND_MW = 32000.0  # Typical UK winter peak demand ~30-40GW
DEFAULT_WIND_INSTALLED_CAPACITY_MW = 30000.0  # Approx GB wind capacity ~30GW
