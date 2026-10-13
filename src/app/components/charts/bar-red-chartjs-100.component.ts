import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-bar-red-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="bar-red-chartjs-100"></canvas>`,
})
export class BarRedChartjs100Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mybarred100Chart!: Chart;

    ngAfterViewInit() {
        this.barred100chart();

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
    barred100chart() {
        const areachartbarred100 = document.getElementById("bar-red-chartjs-100") as HTMLCanvasElement;
        const ctxbarred100 = areachartbarred100.getContext("2d"); // Get the 2D rendering context
        if (ctxbarred100) {
            this.mybarred100Chart = new Chart(areachartbarred100, {
                type: "bar",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "rgba(200, 0, 54, 0.3)",
                            borderWidth: 0,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 8,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "#c80036",
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
        if (this.mybarred100Chart) {
            this.mybarred100Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mybarred100Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
