import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-performance-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="performance-banner-chart"></canvas>`,
})
export class PerformanceBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myperformanceBannerChart!: Chart;

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
        return [
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
            this.randomScalingFactor(),
        ];
    }
    summarychart() {
        const performanceBannerChart = document.getElementById("performance-banner-chart") as HTMLCanvasElement;
        const ctxperformanceBanner = performanceBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxperformanceBanner) {
            var gradientchartperformance = ctxperformanceBanner.createLinearGradient(0, 0, 0, 190);
            gradientchartperformance.addColorStop(0, "rgba(0, 73, 232, 0.95)");
            gradientchartperformance.addColorStop(1, "rgba(0, 73, 232, 0)");
            this.myperformanceBannerChart = new Chart(performanceBannerChart, {
                type: "line",
                data: {
                    labels: ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25", "00:30", "00:35", "00:40", "00:45", "00:50", "00:55", "01:00", "01:05", "01:10", "01:15", "01:20", "01:25", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientchartperformance,
                            borderColor: "#0049e8",
                            borderWidth: 1,
                            fill: true,
                            tension: 0,
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
        if (this.myperformanceBannerChart) {
            this.myperformanceBannerChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myperformanceBannerChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
