# Data Alchemist 🧪
Data Alchemist is a React app for managing, validating, and prioritizing datasets (Clients, Workers, Tasks) in optimization and scheduling. It offers an easy-to-use interface for uploading data, defining rules, and setting priorities.

## Key Features
Data Handling: Upload CSV/XLSX files, view and edit data in an interactive grid with filtering and sorting.

Validation: Automated checks for data integrity within datasets and across them. Errors are highlighted for quick fixes.

Rule Creation: Define rules like co-run tasks, slot restrictions, load limits, phase windows, pattern matching, and precedence orders.

Prioritization: Adjust weights for client priority, fairness, fulfillment, idle time, and overload avoidance. Apply preset profiles for quick setup.

Export: Download all data (Clients, Workers, Tasks, Rules, Weights) as a single ZIP file.
 
### Get Started
Clone: git clone <your-repository-url>

Install: cd data-alchemist && npm install (or yarn install)

Run: npm run dev (or yarn dev)
Open http://localhost:3000 in your browser.

### How to Use
Upload: In the "Data" tab, upload your clients.csv, workers.csv, and tasks.csv (or .xlsx) files.

Review & Edit: View your data in the grid. Filter, sort, and directly edit cells. Errors are shown on the right.

Add Rules: Go to the "Rules" tab. Choose a rule type, enter details, and click "Add Rule".

Set Priorities: In the "Priorities" tab, use sliders to adjust weights or apply a preset.

Export: Click "Export All (ZIP)" to download your complete project data.

### Tech Stack
React.js & Next.js (App Router): Front-end framework.

Tailwind CSS: Styling.

Lucide React: Icons.

PapaParse: CSV parsing.

JSZip: ZIP file generation.

