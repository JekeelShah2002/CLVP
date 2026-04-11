import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../app/core/api.service';
import { LoaderService } from '../../app/core/loader.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css'
})
export class CustomerDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private loader = inject(LoaderService);

  customerId: string | null = null;
  customerData: any = null;
  error: string | null = null;

  @ViewChild('lineChart') lineChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('distChart') distChartRef!: ElementRef;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef;

  private charts: Chart[] = [];

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
        this.fetchDetails();
    } else {
        this.error = "No customer ID provided.";
    }
  }

  fetchDetails() {
    this.loader.show();
    this.error = null;
    this.api.getCustomerDetails(this.customerId!).subscribe({
        next: (res) => {
            if (!res.demographics && !res.features && res.transactions.length === 0) {
                this.error = "Customer not found.";
            } else {
                this.customerData = {
                    ...res,
                    transactions: res.transactions.sort((a: any, b: any) => new Date(b.PurchasedOn).getTime() - new Date(a.PurchasedOn).getTime())
                };
                setTimeout(() => this.renderCharts(), 100);
            }
            this.loader.hide();
        },
        error: (err) => {
            this.error = "Failed to load customer details.";
            console.error(err);
            this.loader.hide();
        }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
      this.charts.forEach(c => c.destroy());
  }

  renderCharts() {
      if (!this.customerData || this.customerData.transactions.length === 0) return;
      this.charts.forEach(c => c.destroy());
      this.charts = [];

      const txs = [...this.customerData.transactions].reverse(); // oldest to newest for charts

      // 1. Line Chart (Purchase Value Over Time)
      if (this.lineChartRef) {
          const lineCtx = this.lineChartRef.nativeElement.getContext('2d');
          const labels = txs.map(t => new Date(t.PurchasedOn).toLocaleDateString());
          const data = txs.map(t => t.TotalPrice);

          this.charts.push(new Chart(lineCtx, {
              type: 'line',
              data: {
                  labels,
                  datasets: [{
                      label: 'Order Value ($)',
                      data: data,
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                      x: { grid: { display: false }, ticks: { color: '#94a3b8', maxTicksLimit: 10 } }
                  }
              }
          }));
      }

      // 2. Bar Chart (Monthly Spend)
      if (this.barChartRef) {
          const monthlyMap = new Map<string, number>();
          txs.forEach(t => {
              const d = new Date(t.PurchasedOn);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              monthlyMap.set(key, (monthlyMap.get(key) || 0) + (t.TotalPrice || 0));
          });
          
          const sortedMonths = Array.from(monthlyMap.keys()).sort();
          const barCtx = this.barChartRef.nativeElement.getContext('2d');
          
          this.charts.push(new Chart(barCtx, {
              type: 'bar',
              data: {
                  labels: sortedMonths,
                  datasets: [{
                      label: 'Monthly Spend ($)',
                      data: sortedMonths.map(k => monthlyMap.get(k) || 0) as number[],
                      backgroundColor: '#10b981',
                      borderRadius: 4
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                  }
              }
          }));
      }

      // 3. Distribution Histogram (Order Sizes)
      if (this.distChartRef) {
          let small = 0, med = 0, large = 0, xl = 0;
          txs.forEach(t => {
              const val = t.TotalPrice || 0;
              if (val < 25) small++;
              else if (val < 75) med++;
              else if (val < 150) large++;
              else xl++;
          });
          
          const distCtx = this.distChartRef.nativeElement.getContext('2d');
          this.charts.push(new Chart(distCtx, {
              type: 'bar',
              data: {
                  labels: ['<$25', '$25-$75', '$75-$150', '>$150'],
                  datasets: [{
                      data: [small, med, large, xl],
                      backgroundColor: ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'],
                      borderRadius: 6
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                  }
              }
          }));
      }

      // 4. Doughnut (Activity Breakdown)
      if (this.doughnutChartRef) {
          const actMap = new Map<string, number>();
          txs.forEach(t => {
              const act = t.ActivityTypeDisplay || 'Standard Order';
              actMap.set(act, (actMap.get(act) || 0) + 1);
          });
          
          const labels = Array.from(actMap.keys());
          const data = labels.map(k => actMap.get(k));
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
          
          const dCtx = this.doughnutChartRef.nativeElement.getContext('2d');
          this.charts.push(new Chart(dCtx, {
              type: 'doughnut',
              data: {
                  labels,
                  datasets: [{
                      data: data as number[],
                      backgroundColor: colors.slice(0, labels.length),
                      borderWidth: 0,
                      hoverOffset: 4
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                      legend: { position: 'bottom', labels: { color: '#cbd5e1', padding: 20 } }
                  }
              }
          }));
      }
  }
}
