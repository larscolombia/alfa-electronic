import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-yellow-chartjs-60",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-yellow-chartjs-60"></canvas>`,
})
export class AreaYellowChartjs60Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myyellow60Chart!: Chart;

    ngAfterViewInit() {
        this.yellow60chart();

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
    yellow60chart() {
        const areachartyellow60 = document.getElementById("app-area-yellow-chartjs-60") as HTMLCanvasElement;
        const ctxyellow60 = areachartyellow60.getContext("2d"); // Get the 2D rendering context
        if (ctxyellow60) {
            const gradientyellow60 = ctxyellow60.createLinearGradient(0, 0, 0, 60);
            gradientyellow60.addColorStop(0, "rgba(241, 157, 0, 0.85)");
            gradientyellow60.addColorStop(0.95, "rgba(241, 157, 0, 0.0)");
            this.myyellow60Chart = new Chart(areachartyellow60, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientyellow60,
                            borderColor: "#fcab16",
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
        if (this.myyellow60Chart) {
            this.myyellow60Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myyellow60Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
