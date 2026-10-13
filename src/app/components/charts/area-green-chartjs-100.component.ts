import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-green-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-green-chartjs-100"></canvas>`,
})
export class AreaGreenChartjs100Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mygreen100Chart!: Chart;

    ngAfterViewInit() {
        this.green100chart();

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
    green100chart() {
        const areachartgreen100 = document.getElementById("app-area-green-chartjs-100") as HTMLCanvasElement;
        const ctxgreen100 = areachartgreen100.getContext("2d"); // Get the 2D rendering context
        if (ctxgreen100) {
            const gradientgreen100 = ctxgreen100.createLinearGradient(0, 0, 0, 100);
            gradientgreen100.addColorStop(0, "rgba(8,160,70, 0.75)");
            gradientgreen100.addColorStop(0.95, "rgba(8,160,70, 0.0)");
            this.mygreen100Chart = new Chart(areachartgreen100, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientgreen100,
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
                            display: false,
                            beginAtZero: true,
                        },
                        x: {
                            display: false,
                        },
                    },
                },
            });
        }
    }
    randomizeChart() {
        if (this.mygreen100Chart) {
            this.mygreen100Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mygreen100Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
