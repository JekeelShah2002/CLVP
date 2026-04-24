import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../app/core/api.service';
import { LoaderService } from '../../app/core/loader.service';
import { Chart, registerables } from 'chart.js';
import { AnimatedBgComponent } from '../../shared/animated-bg/animated-bg.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AnimatedBgComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private loader = inject(LoaderService);

  data: any = null;
  error: string | null = null;

  // Chart refs
  @ViewChild('revenueChart') revenueChartRef!: ElementRef;
  @ViewChild('segmentChart') segmentChartRef!: ElementRef;
  @ViewChild('tierChart') tierChartRef!: ElementRef;
  @ViewChild('genderChart') genderChartRef!: ElementRef;
  @ViewChild('occupationChart') occupationChartRef!: ElementRef;
  @ViewChild('satisfactionChart') satisfactionChartRef!: ElementRef;
  @ViewChild('clvDistChart') clvDistChartRef!: ElementRef;
  @ViewChild('stateChart') stateChartRef!: ElementRef;
  @ViewChild('emailSubChart') emailSubChartRef!: ElementRef;
  @ViewChild('incomeChart') incomeChartRef!: ElementRef;

  private charts: Chart[] = [];

  ngOnInit() {
    this.fetchAnalytics();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  fetchAnalytics() {
    this.loader.show();
    this.api.getDashboardAnalytics().subscribe({
      next: (res) => {
        this.data = res;
        this.loader.hide();
        setTimeout(() => this.renderAllCharts(), 150);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load dashboard analytics.';
        this.loader.hide();
      }
    });
  }

  // ── Shared Chart Defaults ────────────────────────────────────────────
  private readonly gridColor = 'rgba(255, 255, 255, 0.05)';
  private readonly tickColor = '#94a3b8';
  private readonly fontFamily = "'Inter', 'Manrope', sans-serif";

  private readonly palette = {
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    pink: '#ec4899',
    rose: '#f43f5e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    amber: '#f59e0b',
    orange: '#f97316',
    slate: '#64748b',
  };

  private readonly segmentColors: Record<string, string> = {
    'Champion': '#facc15',
    'Loyal Star': '#10b981',
    'Growth Potential': '#6366f1',
    'Standard': '#64748b',
    'At-Risk': '#f43f5e',
  };

  // ── Gradient helpers (use actual canvas dimensions) ──────────────────
  private vGrad(canvas: HTMLCanvasElement, c1: string, c2: string): CanvasGradient {
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  private hGrad(canvas: HTMLCanvasElement, c1: string, c2: string): CanvasGradient {
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  private triGrad(canvas: HTMLCanvasElement, c1: string, c2: string, c3: string, vertical = true): CanvasGradient {
    const ctx = canvas.getContext('2d')!;
    const g = vertical
      ? ctx.createLinearGradient(0, 0, 0, canvas.height)
      : ctx.createLinearGradient(0, 0, canvas.width, 0);
    g.addColorStop(0, c1);
    g.addColorStop(0.5, c2);
    g.addColorStop(1, c3);
    return g;
  }

  private readonly tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    cornerRadius: 8,
    padding: 10,
  };

  renderAllCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    if (!this.data) return;
    this.renderRevenueChart();
    this.renderSegmentChart();
    this.renderTierChart();
    this.renderGenderChart();
    this.renderOccupationChart();
    this.renderSatisfactionChart();
    this.renderClvDistChart();
    this.renderStateChart();
    this.renderEmailSubChart();
    this.renderIncomeChart();
  }

  // 1. Monthly Revenue Trend — cyan→purple gradient area
  private renderRevenueChart() {
    if (!this.revenueChartRef || !this.data.monthlyRevenue) return;
    const canvas = this.revenueChartRef.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const labels = this.data.monthlyRevenue.map((m: any) => m.month);
    const values = this.data.monthlyRevenue.map((m: any) => m.revenue);
    const fill = this.triGrad(canvas, 'rgba(6,182,212,0.4)', 'rgba(99,102,241,0.2)', 'rgba(139,92,246,0.0)');
    const stroke = this.hGrad(canvas, '#06b6d4', '#a855f7');

    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{
        label: 'Revenue ($)', data: values,
        borderColor: stroke, backgroundColor: fill,
        borderWidth: 3, fill: true, tension: 0.4,
        pointRadius: 2, pointBackgroundColor: '#06b6d4', pointHoverRadius: 7,
        pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#06b6d4', pointHoverBorderWidth: 2
      }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...this.tooltipStyle, callbacks: { label: (c: any) => `$${c.parsed.y.toLocaleString()}` } } },
        scales: {
          y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor, callback: (v: any) => '$' + (v/1000).toFixed(0) + 'K' } },
          x: { grid: { display: false }, ticks: { color: this.tickColor, maxTicksLimit: 12 } }
        }
      }
    }));
  }

  // 2. Customer Segments — gradient ring
  private renderSegmentChart() {
    if (!this.segmentChartRef || !this.data.segments) return;
    const ctx = this.segmentChartRef.nativeElement.getContext('2d');
    const labels = Object.keys(this.data.segments);
    const values = Object.values(this.data.segments) as number[];
    const colors = labels.map(l => this.segmentColors[l] || this.palette.slate);
    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 10, borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 14, usePointStyle: true, pointStyleWidth: 10, font: { family: this.fontFamily, size: 11 } } }, tooltip: this.tooltipStyle } }
    }));
  }

  // 3. Loyalty Tiers — dramatic horizontal gradient bars
  private renderTierChart() {
    if (!this.tierChartRef || !this.data.tiers) return;
    const canvas = this.tierChartRef.nativeElement as HTMLCanvasElement;
    const labels = Object.keys(this.data.tiers).map(t => t.charAt(0).toUpperCase() + t.slice(1));
    const values = Object.values(this.data.tiers) as number[];
    const gradients = [
      this.hGrad(canvas, '#f59e0b', '#ef4444'),
      this.hGrad(canvas, '#06b6d4', '#8b5cf6'),
      this.hGrad(canvas, '#475569', '#1e293b'),
    ];
    this.charts.push(new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: gradients.slice(0, labels.length), borderRadius: 8, barThickness: 28 }] },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle },
        scales: { x: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { weight: 'bold' as const } } } } }
    }));
  }

  // 4. Gender Split — gradient pie
  private renderGenderChart() {
    if (!this.genderChartRef || !this.data.genders) return;
    const ctx = this.genderChartRef.nativeElement.getContext('2d');
    const labels = Object.keys(this.data.genders);
    const values = Object.values(this.data.genders) as number[];
    this.charts.push(new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: values, backgroundColor: ['#8b5cf6', '#06b6d4', '#64748b'], borderWidth: 0, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 14, usePointStyle: true, font: { family: this.fontFamily, size: 11 } } }, tooltip: this.tooltipStyle } }
    }));
  }

  // 5. Occupation — dramatic horizontal gradient bars
  private renderOccupationChart() {
    if (!this.occupationChartRef || !this.data.occupations) return;
    const canvas = this.occupationChartRef.nativeElement as HTMLCanvasElement;
    const sorted = Object.entries(this.data.occupations).sort((a: any, b: any) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]) as number[];
    const grads = [
      this.hGrad(canvas, '#6366f1', '#ec4899'),
      this.hGrad(canvas, '#10b981', '#06b6d4'),
      this.hGrad(canvas, '#f59e0b', '#ef4444'),
      this.hGrad(canvas, '#ec4899', '#8b5cf6'),
      this.hGrad(canvas, '#06b6d4', '#3b82f6'),
    ];
    this.charts.push(new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: grads.slice(0, labels.length), borderRadius: 8, barThickness: 24 }] },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle },
        scales: { x: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0' } } } }
    }));
  }

  // 6. Customer Satisfaction — gradient doughnut
  private renderSatisfactionChart() {
    if (!this.satisfactionChartRef || !this.data.satisfactions) return;
    const ctx = this.satisfactionChartRef.nativeElement.getContext('2d');
    const labels = Object.keys(this.data.satisfactions).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const values = Object.values(this.data.satisfactions) as number[];
    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'], borderWidth: 0, hoverOffset: 8, borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 14, usePointStyle: true, font: { family: this.fontFamily, size: 11 } } }, tooltip: this.tooltipStyle } }
    }));
  }

  // 7. CLV Distribution — dramatic vertical gradient bars
  private renderClvDistChart() {
    if (!this.clvDistChartRef || !this.data.clvDistribution) return;
    const canvas = this.clvDistChartRef.nativeElement as HTMLCanvasElement;
    const labels = Object.keys(this.data.clvDistribution);
    const values = Object.values(this.data.clvDistribution) as number[];
    const grads = [
      this.vGrad(canvas, '#64748b', '#1e293b'),
      this.vGrad(canvas, '#06b6d4', '#1e3a5f'),
      this.vGrad(canvas, '#3b82f6', '#312e81'),
      this.vGrad(canvas, '#8b5cf6', '#4c1d95'),
      this.vGrad(canvas, '#10b981', '#064e3b'),
    ];
    this.charts.push(new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: grads, borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle },
        scales: { y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }, x: { grid: { display: false }, ticks: { color: this.tickColor } } } }
    }));
  }

  // 8. Top States — teal→indigo vertical gradient
  private renderStateChart() {
    if (!this.stateChartRef || !this.data.topStates) return;
    const canvas = this.stateChartRef.nativeElement as HTMLCanvasElement;
    const labels = this.data.topStates.map((s: any) => s.state);
    const values = this.data.topStates.map((s: any) => s.count);
    const grad = this.vGrad(canvas, '#14b8a6', '#1e3a5f');
    this.charts.push(new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: grad, borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle },
        scales: { y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }, x: { grid: { display: false }, ticks: { color: this.tickColor, maxRotation: 45 } } } }
    }));
  }

  // 9. Email Subscribers — emerald/slate gradient doughnut
  private renderEmailSubChart() {
    if (!this.emailSubChartRef || !this.data.emailSubscribers) return;
    const ctx = this.emailSubChartRef.nativeElement.getContext('2d');
    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Subscribed', 'Not Subscribed'], datasets: [{ data: [this.data.emailSubscribers.Yes, this.data.emailSubscribers.No], backgroundColor: ['#10b981', '#334155'], borderWidth: 0, borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 14, usePointStyle: true, font: { family: this.fontFamily, size: 11 } } }, tooltip: this.tooltipStyle } }
    }));
  }

  // 10. Income Brackets — orange→deep-rose gradient
  private renderIncomeChart() {
    if (!this.incomeChartRef || !this.data.incomeBrackets) return;
    const canvas = this.incomeChartRef.nativeElement as HTMLCanvasElement;
    const labels = Object.keys(this.data.incomeBrackets);
    const values = Object.values(this.data.incomeBrackets) as number[];
    const grad = this.vGrad(canvas, '#f97316', '#7f1d1d');
    this.charts.push(new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: grad, borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle },
        scales: { y: { grid: { color: this.gridColor }, ticks: { color: this.tickColor } }, x: { grid: { display: false }, ticks: { color: this.tickColor } } } }
    }));
  }

  // ── Template helpers ─────────────────────────────────────────────────
  getSegmentClass(segment: string): string {
    const s = (segment || '').toLowerCase();
    if (s.includes('champion')) return 'champion';
    if (s.includes('at-risk')) return 'at-risk';
    if (s.includes('loyal')) return 'loyal';
    if (s.includes('growth')) return 'growth';
    return 'standard';
  }

  getTierClass(tier: string): string {
    const t = (tier || '').toLowerCase();
    if (t === 'high') return 'tier-high';
    if (t === 'medium') return 'tier-medium';
    return 'tier-low';
  }
}
