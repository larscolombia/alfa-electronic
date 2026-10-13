import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-bar-pink-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="bar-pink-chartjs-100"></canvas>`,
})
export class BarPinkChartjs100Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mybarpink100Chart!: Chart;

    ngAfterViewInit() {
        this.barpink100chart();

        this.intervalId = setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    barpink100chart() {
        const areachartbarpink100 = document.getElementById("bar-pink-chartjs-100") as HTMLCanvasElement;
        const ctxbarpink100 = areachartbarpink100.getContext("2d"); // Get the 2D rendering context
        if (ctxbarpink100) {
            this.mybarpink100Chart = new Chart(areachartbarpink100, {
                type: "bar",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "rgba(229, 10, 142, 0.15)",
                            borderWidth: 0,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 8,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "#E50A8E",
                            borderWidth: 0,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 8,
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
                            display: true,
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
        if (this.mybarpink100Chart) {
            this.mybarpink100Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mybarpink100Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
