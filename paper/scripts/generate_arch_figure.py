"""
Generate publication-quality system architecture figure for AURA M&A paper.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(7.2, 2.5), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 42)
ax.axis('off')

# Color palette
c_blue = '#1e40af'
c_cyan = '#0e7490'
c_purple = '#6b21a8'
c_green = '#15803d'

# Stage 1: Acquirer Mandate & AHP
rect1 = patches.FancyBboxPatch((2, 7), 21, 29, boxstyle="round,pad=0.5", ec=c_blue, fc='#eff6ff', lw=1.5)
ax.add_patch(rect1)
ax.text(12.5, 32.0, 'Stage 1: Mandate\n& AHP Weighting', ha='center', va='center', fontsize=8.5, fontweight='bold', color=c_blue)
ax.text(12.5, 19.5, '• Pairwise Matrix A\n• Eigenvector w\n• Consistency CR < 0.10\n• 7 Strategic Criteria', ha='center', va='center', fontsize=7.2, color='#1e293b')

# Arrow 1 -> 2
ax.annotate('', xy=(26, 21.5), xytext=(23.5, 21.5), arrowprops=dict(facecolor='#64748b', edgecolor='none', arrowstyle='->', lw=2.0))

# Stage 2: Compensatory TOPSIS Ranking
rect2 = patches.FancyBboxPatch((26.5, 7), 21, 29, boxstyle="round,pad=0.5", ec=c_cyan, fc='#ecfeff', lw=1.5)
ax.add_patch(rect2)
ax.text(37.0, 32.0, 'Stage 2: Compensatory\nTOPSIS Ranking', ha='center', va='center', fontsize=8.5, fontweight='bold', color=c_cyan)
ax.text(37.0, 19.5, '• Vector Norm v_ij\n• Ideal Solutions v+, v-\n• Closeness C_i in [0,1]\n• Offsets valuation gaps', ha='center', va='center', fontsize=7.2, color='#1e293b')

# Arrow 2 -> 3
ax.annotate('', xy=(50.5, 21.5), xytext=(48.0, 21.5), arrowprops=dict(facecolor='#64748b', edgecolor='none', arrowstyle='->', lw=2.0))

# Stage 3: Explainability & Stability
rect3 = patches.FancyBboxPatch((51.0, 7), 21, 29, boxstyle="round,pad=0.5", ec=c_purple, fc='#faf5ff', lw=1.5)
ax.add_patch(rect3)
ax.text(61.5, 32.0, 'Stage 3: Local Audit\n& Dirichlet Stability', ha='center', va='center', fontsize=8.5, fontweight='bold', color=c_purple)
ax.text(61.5, 19.5, '• Distance share s_ij\n• Per-rank audit vector\n• w ~ Dir(60w), N=10k\n• P(first) & Spearman rho', ha='center', va='center', fontsize=7.2, color='#1e293b')

# Arrow 3 -> 4
ax.annotate('', xy=(75.0, 21.5), xytext=(72.5, 21.5), arrowprops=dict(facecolor='#64748b', edgecolor='none', arrowstyle='->', lw=2.0))

# Stage 4: Monte Carlo Synergy Valuation
rect4 = patches.FancyBboxPatch((75.5, 7), 22, 29, boxstyle="round,pad=0.5", ec=c_green, fc='#f0fdf4', lw=1.5)
ax.add_patch(rect4)
ax.text(86.5, 32.0, 'Stage 4: Probabilistic\nSynergy Underwriting', ha='center', va='center', fontsize=8.5, fontweight='bold', color=c_green)
ax.text(86.5, 19.5, '• Cash flows S(u, c)\n• Execution haircut theta\n• V_S distribution, N=20k\n• P(V_S >= premium)', ha='center', va='center', fontsize=7.2, color='#1e293b')

# Platform foundation label at bottom
rect_plat = patches.FancyBboxPatch((2, 1.2), 95.5, 3.8, boxstyle="round,pad=0.2", ec='#94a3b8', fc='#f1f5f9', lw=1.0, linestyle='--')
ax.add_patch(rect_plat)
ax.text(50, 3.1, 'AURA M&A Intelligence Platform Engine (React 19 + TypeScript + AWS Serverless)', ha='center', va='center', fontsize=7.5, fontweight='bold', color='#334155')

plt.tight_layout()
plt.savefig('paper/figures/system_architecture.pdf', bbox_inches='tight')
plt.savefig('paper/figures/system_architecture.png', bbox_inches='tight')
plt.close()
print("Saved paper/figures/system_architecture.pdf successfully")
