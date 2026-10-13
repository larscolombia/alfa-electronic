import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgxEditorComponent, NgxEditorMenuComponent, Editor } from "ngx-editor";
import { FormsModule } from "@angular/forms";

@Component({
    selector: "app-compose-mail",
    standalone: true,
    imports: [NgxEditorComponent, NgxEditorMenuComponent, FormsModule],
    template: `
        <!-- breadcrumb -->
        <div class="container-fluid mt-3">
            <div class="row gx-3 align-items-center">
                <div class="col col-sm">
                    <h5>Compose Mail</h5>
                </div>
                <div class="col-auto ms-auto"></div>
            </div>
        </div>

        <!-- Content -->
        <div class="container-fluid my-3">
            <!-- Title -->
            <div class="form-floating mb-3">
                <input type="text" class="form-control" id="sendto" placeholder="Select Send to" value="cotact&#64;testmail.com" />
                <label for="sendto">Send to</label>
            </div>

            <!-- Title -->
            <div class="form-floating mb-3">
                <input type="text" class="form-control" id="subject" placeholder="Subject" value="Adminuiux template for your all need for business" />
                <label for="subject">Subject</label>
            </div>

            <!-- Textarea -->
            <h6 class="mb-3">Your Message</h6>
            <div class="NgxEditor__Wrapper mb-3">
                <ngx-editor-menu [editor]="editor" class=" rounded"> </ngx-editor-menu>
                <ngx-editor [editor]="editor" [ngModel]="html" [disabled]="false" [placeholder]="'Type here...'" class="rounded height-300"> </ngx-editor>
            </div>

            <!-- dropzone -->
            <h6 class="mb-3">Attachments</h6>
            <div class="dropzone text-center position-relative z-index-0 mb-3">
                <div class="dz-default dz-message my-2">
                    <i class="h1 bi bi-cloud-upload"></i><br />
                    <button class="btn btn-link" type="button">Click here to upload</button>
                </div>
                <input type="file" class="position-absolute z-index-1 top-0 start-0 h-100 w-100 rounded opacity-0" />
            </div>

            <p class="text-secondary small">Upload only .jpeg, .png, .mp4, .mpeg4 file format max. file size 6MB</p>

            <div class="row mt-3">
                <div class="col">
                    <button class="btn btn-link theme-red" type="button" data-bs-dismiss="modal" aria-label="Close"><i class="bi bi-trash h4 me-2"></i> Discard</button>
                </div>
                <div class="col-auto">
                    <button class="btn btn-theme" type="button"><i class="bi bi-send me-2"></i> Send</button>
                </div>
            </div>
        </div>
    `,
})
export class ComposeMailComponent {
    html = "";
    editor!: Editor;
    ngOnInit(): void {
        this.editor = new Editor();
    }

    ngOnDestroy(): void {
        this.editor.destroy();
    }
}
