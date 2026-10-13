import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-network-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="network-banner-chart"></canvas>`,
})
export class NetworkBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mynetworkBannerChart!: Chart;

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
        const networkBannerChart = document.getElementById("network-banner-chart") as HTMLCanvasElement;
        const ctxnetworkBanner = networkBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxnetworkBanner) {
            var gradientchartserver = ctxnetworkBanner.createLinearGradient(0, 0, 0, 230);
            gradientchartserver.addColorStop(0, "rgb(241, 157, 0, 0.95)");
            gradientchartserver.addColorStop(1, "rgb(241, 157, 0, 0)");
            this.mynetworkBannerChart = new Chart(networkBannerChart, {
                type: "line",
                data: {
                    labels: ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25", "00:30", "00:35", "00:40", "00:45", "00:50", "00:55", "01:00", "01:05", "01:10", "01:15", "01:20", "01:25", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientchartserver,
                            borderColor: "#fcab16",
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
        if (this.mynetworkBannerChart) {
            this.mynetworkBannerChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mynetworkBannerChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
