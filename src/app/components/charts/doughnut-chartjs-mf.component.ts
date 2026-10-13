import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-doughnut-chartjs-mf",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="doughnut-chartjs-mf"></canvas>`,
})
export class DoughnutChartjsMFComponent {
    mydoughnutmfChart!: Chart;

    ngAfterViewInit() {
        this.doughnutmfchart();
    }

    /* chart  */
    doughnutmfchart() {
        const areachartdoughnutmf = document.getElementById("doughnut-chartjs-mf") as HTMLCanvasElement;
        const ctxdoughnutmf = areachartdoughnutmf.getContext("2d"); // Get the 2D rendering context
        if (ctxdoughnutmf) {
            this.mydoughnutmfChart = new Chart(areachartdoughnutmf, {
                type: "doughnut",
                data: {
                    labels: ["Male", "Female", "Other"],
                    datasets: [
                        {
                            label: "Expense categories",
                            data: [40, 45, 5],
                            backgroundColor: ["#c80036", "#0249e8", "#becede"],
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
