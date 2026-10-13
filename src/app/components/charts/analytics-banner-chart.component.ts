import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-analytics-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="analytics-banner-chart"></canvas>`,
})
export class AnalyticsBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myanalyticsBannerChart!: Chart;

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
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    summarychart() {
        const analyticsBannerChart = document.getElementById("analytics-banner-chart") as HTMLCanvasElement;
        const ctxanalyticsBanner = analyticsBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxanalyticsBanner) {
            this.myanalyticsBannerChart = new Chart(analyticsBannerChart, {
                type: "line",
                data: {
                    labels: ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25", "00:30", "00:35", "00:40"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: "transparent",
                            borderColor: "#a4c1ffff",
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: "transparent",
                            borderColor: "#0049e8",
                            borderWidth: 2,
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
        if (this.myanalyticsBannerChart) {
            this.myanalyticsBannerChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myanalyticsBannerChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
