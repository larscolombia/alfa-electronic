import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-green-chartjs-60",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-green-chartjs-60"></canvas>`,
})
export class AreaGreenChartjs60Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mygreen60Chart!: Chart;

    ngAfterViewInit() {
        this.green60chart();

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
    green60chart() {
        const areachartgreen60 = document.getElementById("app-area-green-chartjs-60") as HTMLCanvasElement;
        const ctxgreen60 = areachartgreen60.getContext("2d"); // Get the 2D rendering context
        if (ctxgreen60) {
            const gradientgreen60 = ctxgreen60.createLinearGradient(0, 0, 0, 60);
            gradientgreen60.addColorStop(0, "rgba(8,160,70, 0.75)");
            gradientgreen60.addColorStop(0.95, "rgba(8,160,70, 0.0)");
            this.mygreen60Chart = new Chart(areachartgreen60, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientgreen60,
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
        if (this.mygreen60Chart) {
            this.mygreen60Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mygreen60Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
