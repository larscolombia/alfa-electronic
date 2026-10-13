import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-doughnut-chartjs-180",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="doughnut-chartjs-180"></canvas>`,
})
export class DoughnutChartjs180Component {
    mydoughnut180Chart!: Chart;

    ngAfterViewInit() {
        this.doughnut180chart();
    }

    /* chart  */
    doughnut180chart() {
        const areachartdoughnut180 = document.getElementById("doughnut-chartjs-180") as HTMLCanvasElement;
        const ctxdoughnut180 = areachartdoughnut180.getContext("2d"); // Get the 2D rendering context
        if (ctxdoughnut180) {
            this.mydoughnut180Chart = new Chart(areachartdoughnut180, {
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
                    cutout: 62,
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
