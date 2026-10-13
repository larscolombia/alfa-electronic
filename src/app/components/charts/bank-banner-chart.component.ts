import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-bank-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="bank-banner-chart"></canvas>`,
})
export class BankBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mybankBannerChart!: Chart;

    ngAfterViewInit() {
        this.summarychart();

        this.intervalId = setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    summarychart() {
        const bankBannerChart = document.getElementById("bank-banner-chart") as HTMLCanvasElement;
        const ctxBankBanner = bankBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxBankBanner) {
            var gradientblue1 = ctxBankBanner.createLinearGradient(0, 0, 0, 220);
            gradientblue1.addColorStop(0, "rgba(0, 73, 232, 0.65)");
            gradientblue1.addColorStop(1, "rgba(0, 73, 232, 0)");
            var gradientred1 = ctxBankBanner.createLinearGradient(0, 0, 0, 220);
            gradientred1.addColorStop(0, "rgba(200, 0, 54, 0.40)");
            gradientred1.addColorStop(1, "rgba(200, 0, 54, 0)");
            var gradientgreen1 = ctxBankBanner.createLinearGradient(0, 0, 0, 220);
            gradientgreen1.addColorStop(0, "rgba(8, 160, 70, 0.5)");
            gradientgreen1.addColorStop(1, "rgba(8, 160, 70, 0)");
            this.mybankBannerChart = new Chart(bankBannerChart, {
                type: "line",
                data: {
                    labels: ["Jan-15", "Jan-30", "Feb-15", "Feb-30", "Mar-15", "Mar-30", "Apr-15", "Apr-30", "May-15", "May-30", "Jun-15", "Jun-30", "Jul-15", "Jul-30", "Aug-15", "Aug-30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientgreen1,
                            borderColor: "rgb(8, 160, 70)",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientred1,
                            borderColor: "rgba(200, 0, 54, 0.65)",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientblue1,
                            borderColor: "rgba(0, 73, 232, 1)",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.0,
                        } as any,
                    ],
                },
                options: {
                    layout: {
                        padding: 0,
                    },
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                        },
                    },
                    scales: {
                        y: {
                            display: false,
                            beginAtZero: true,
                            grid: {
                                display: false,
                            },
                        },
                        x: {
                            display: false,
                            beginAtZero: true,
                            grid: {
                                display: false,
                            },
                        },
                    },
                },
            });
        }
    }
    randomizeChart() {
        if (this.mybankBannerChart) {
            this.mybankBannerChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mybankBannerChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
