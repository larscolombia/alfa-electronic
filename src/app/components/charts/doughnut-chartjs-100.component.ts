import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-doughnut-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="doughnut-chartjs-100"></canvas>`,
})
export class DoughnutChartjs100Component {
    mydoughnut100Chart!: Chart;

    ngAfterViewInit() {
        this.doughnut100chart();
    }

    /* chart  */
    doughnut100chart() {
        const areachartdoughnut100 = document.getElementById("doughnut-chartjs-100") as HTMLCanvasElement;
        const ctxdoughnut100 = areachartdoughnut100.getContext("2d"); // Get the 2D rendering context
        if (ctxdoughnut100) {
            this.mydoughnut100Chart = new Chart(areachartdoughnut100, {
                type: "doughnut",
                data: {
                    labels: ["Food", "Transport", "Children", "Home", "Other"],
                    datasets: [
                        {
                            label: "Expense categories",
                            data: [40, 10, 15, 25, 10],
                            backgroundColor: ["#fcab16", "#08a046", "#c80036", "#0249e8", "#becede"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    cutout: 40,
                    plugins: {
                        legend: {
                            display: false,
                            position: "top",
                        },
                        title: {
                            display: false,
                            text: "",
                        },
                    },
                },
            });
        }
    }
}
