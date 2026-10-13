import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-green-chartjs-200",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-green-chartjs-200"></canvas>`,
})
export class AreaGreenChartjs200Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mygreen200Chart!: Chart;

    ngAfterViewInit() {
        this.green200chart();

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
    green200chart() {
        const areachartgreen200 = document.getElementById("app-area-green-chartjs-200") as HTMLCanvasElement;
        const ctxgreen200 = areachartgreen200.getContext("2d"); // Get the 2D rendering context
        if (ctxgreen200) {
            const gradientgreen200 = ctxgreen200.createLinearGradient(0, 0, 0, 170);
            gradientgreen200.addColorStop(0, "rgba(8,160,70, 0.75)");
            gradientgreen200.addColorStop(0.9, "rgba(8,160,70, 0.0)");
            this.mygreen200Chart = new Chart(areachartgreen200, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientgreen200,
                            borderColor: "#08a046",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.4,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            display: true,
                            beginAtZero: true,
                            grid: {
                                display: false,
                            },
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
        if (this.mygreen200Chart) {
            this.mygreen200Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mygreen200Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
