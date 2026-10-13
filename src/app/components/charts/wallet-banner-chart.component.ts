import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-wallet-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="wallet-banner-chart"></canvas>`,
})
export class WalletBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mywalletBannerChartChart!: Chart;

    ngAfterViewInit() {
        this.walletBannerChartchart();

        this.intervalId = setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    walletBannerChartchart() {
        const areachartwalletBannerChart = document.getElementById("wallet-banner-chart") as HTMLCanvasElement;
        const ctxwalletBannerChart = areachartwalletBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxwalletBannerChart) {
            var gradientblue = ctxwalletBannerChart.createLinearGradient(0, 0, 0, 195);
            gradientblue.addColorStop(0, "rgba(0, 73, 232, 1)");
            gradientblue.addColorStop(1, "rgba(0, 73, 232, 0.1)");
            var gradientred1 = ctxwalletBannerChart.createLinearGradient(0, 0, 0, 190);
            gradientred1.addColorStop(0, "rgba(200, 0, 54, 1)");
            gradientred1.addColorStop(1, "rgba(200, 0, 54, 0.3)");
            var gradientgreen1 = ctxwalletBannerChart.createLinearGradient(0, 0, 0, 195);
            gradientgreen1.addColorStop(0, "rgba(8, 160, 70, 1)");
            gradientgreen1.addColorStop(1, "rgba(8, 160, 70, 0.1)");

            this.mywalletBannerChartChart = new Chart(areachartwalletBannerChart, {
                type: "bar",
                data: {
                    labels: ["Jan-15", "Jan-30", "Feb-15", "Feb-30", "Mar-15", "Mar-30", "Apr-15", "Apr-30", "May-15", "May-30", "Jun-15", "Jun-30", "Jul-15", "Jul-30", "Aug-15", "Aug-30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientgreen1,
                            borderColor: "#08a046",
                            borderWidth: 1,
                            borderRadius: 15,
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
                            borderRadius: 15,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientblue,
                            borderColor: "#0049e8",
                            borderWidth: 1,
                            borderRadius: 15,
                            fill: true,
                            tension: 0.0,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: -10,
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            display: false,
                            beginAtZero: true,
                        },
                        x: {
                            display: false,
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
        if (this.mywalletBannerChartChart) {
            this.mywalletBannerChartChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mywalletBannerChartChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
