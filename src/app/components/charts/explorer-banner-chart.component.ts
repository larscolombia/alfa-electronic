import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-explorer-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="explorer-banner-chart"></canvas>`,
})
export class ExplorerBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myexplorerBannerChart!: Chart;

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
        const explorerBannerChart = document.getElementById("explorer-banner-chart") as HTMLCanvasElement;
        const ctxexplorerBanner = explorerBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxexplorerBanner) {
            var gradientblue1 = ctxexplorerBanner.createLinearGradient(0, 0, 0, 220);
            gradientblue1.addColorStop(0, "rgba(1, 94, 194, 0.55)");
            gradientblue1.addColorStop(1, "rgba(1, 94, 193, 0)");
            var gradientred1 = ctxexplorerBanner.createLinearGradient(0, 0, 0, 235);
            gradientred1.addColorStop(0, "rgba(240, 61, 79, 0.85)");
            gradientred1.addColorStop(1, "rgba(255, 223, 220, 0)");
            var gradientgreen1 = ctxexplorerBanner.createLinearGradient(0, 0, 0, 240);
            gradientgreen1.addColorStop(0, "rgba(255, 193, 7, 0.5)");
            gradientgreen1.addColorStop(1, "rgba(255, 193, 7, 0)");
            this.myexplorerBannerChart = new Chart(explorerBannerChart, {
                type: "line",
                data: {
                    labels: ["Jan-15", "Jan-30", "Feb-15", "Feb-30", "Mar-15", "Mar-30", "Apr-15", "Apr-30", "May-15", "May-30", "Jun-15", "Jun-30", "Jul-15", "Jul-30", "Aug-15", "Aug-30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 1,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientgreen1,
                            borderColor: "#ffc107",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.4,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 1,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientred1,
                            borderColor: "rgba(200, 0, 54, 0.65)",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.4,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 1,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientblue1,
                            borderColor: "rgba(0, 73, 232, 1)",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.4,
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
        if (this.myexplorerBannerChart) {
            this.myexplorerBannerChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myexplorerBannerChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
