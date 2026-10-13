import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-bar-pink-chartjs-40",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="bar-pink-chartjs-40"></canvas>`,
})
export class BarPinkChartjs40Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mybarpink40Chart!: Chart;

    ngAfterViewInit() {
        this.barpink40chart();

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
    barpink40chart() {
        const areachartbarpink40 = document.getElementById("bar-pink-chartjs-40") as HTMLCanvasElement;
        const ctxbarpink40 = areachartbarpink40.getContext("2d"); // Get the 2D rendering context
        if (ctxbarpink40) {
            this.mybarpink40Chart = new Chart(areachartbarpink40, {
                type: "bar",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "rgba(229, 10, 142, 0.15)",
                            borderWidth: 0,
                            borderRadius: 4,
                            borderSkipped: false,
                            barThickness: 4,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "#E50A8E",
                            borderWidth: 0,
                            borderRadius: 4,
                            borderSkipped: false,
                            barThickness: 4,
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
        if (this.mybarpink40Chart) {
            this.mybarpink40Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mybarpink40Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
