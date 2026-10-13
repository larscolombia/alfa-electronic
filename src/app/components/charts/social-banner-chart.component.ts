import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-social-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="social-banner-chart"></canvas>`,
})
export class SocialBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mysocialBannerChart!: Chart;

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
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    summarychart() {
        const socialBannerChart = document.getElementById("social-banner-chart") as HTMLCanvasElement;
        const ctxsocialBanner = socialBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxsocialBanner) {
            var gradientsocialtrafficblue = ctxsocialBanner.createLinearGradient(0, 0, 0, 180);
            gradientsocialtrafficblue.addColorStop(0, "rgba(0, 73, 232, 0.85)");
            gradientsocialtrafficblue.addColorStop(1, "rgba(0, 73, 232, 0)");
            var gradientsocialtrafficred1 = ctxsocialBanner.createLinearGradient(0, 0, 0, 180);
            gradientsocialtrafficred1.addColorStop(0, "rgba(200, 0, 54, 0.85)");
            gradientsocialtrafficred1.addColorStop(1, "rgba(200, 0, 54, 0)");
            this.mysocialBannerChart = new Chart(socialBannerChart, {
                type: "line",
                data: {
                    labels: ["1 Feb", "2 Feb", "3 Feb", "4 Feb", "5 Feb", "6 Feb", "7 Feb", "8 Feb", "9 Feb", "10 Feb", "11 Feb", "12 Feb"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientsocialtrafficblue,
                            borderColor: "#0049e8",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.35,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientsocialtrafficred1,
                            borderColor: "#c80036",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.35,
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
                            display: true,
                            beginAtZero: true,
                            grid: {
                                display: true,
                                color: "rgba(0,0,0,0.04)",
                                lineWidth: 1,
                            },
                        },
                        x: {
                            display: true,
                            beginAtZero: true,
                            grid: {
                                display: true,
                                color: "rgba(0,0,0,0.04)",
                                lineWidth: 1,
                            },
                        },
                    },
                },
            });
        }
    }
    randomizeChart() {
        if (this.mysocialBannerChart) {
            this.mysocialBannerChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mysocialBannerChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
