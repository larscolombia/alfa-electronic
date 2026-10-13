import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from "@angular/core";

@Component({
    selector: "app-password-strength",
    standalone: true,
    template: `
        <div class="form-floating mb-2">
            <input type="password" #passwordInput class="form-control" id="checkstrength" placeholder="Password" />
            <label for="checkstrength">Password</label>
            <div class="invalid-feedback">Please provide a password.</div>
        </div>
        <div class="row gx-3">
            <div class="col">
                <div id #fieldPassWrap class="check-strength ps-3">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
            <div class="col-auto">
                <p #passwordText>
                    {{ strengthMessage }}
                    <i class="bi bi-info-circle text-theme-1 ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Password should contain atleast 1 capital, 1 alphanumeric & min. 8 characters"></i>
                </p>
            </div>
        </div>
    `,
})
export class PasswordStrengthComponent implements AfterViewInit, OnDestroy {
    @ViewChild("passwordInput") passwordInput?: ElementRef; // make optional
    @ViewChild("passwordText") passwordText?: ElementRef; // make optional
    @ViewChild("fieldPassWrap") fieldPassWrap?: ElementRef; // make optional
    strengthMessage: string = "";
    private keyupHandler!: () => void;

    constructor() {}

    ngAfterViewInit() {
        if (this.passwordInput && this.passwordInput.nativeElement) {
            this.keyupHandler = () => {
                if (this.fieldPassWrap && this.fieldPassWrap.nativeElement) {
                    this.strengthMessage = this.checkStrength(this.passwordInput!.nativeElement.value, this.fieldPassWrap!.nativeElement);
                    if (this.fieldPassWrap!.nativeElement) {
                        if (this.passwordInput!.nativeElement.value) {
                            this.fieldPassWrap!.nativeElement.classList.remove("show");
                        } else {
                            this.fieldPassWrap!.nativeElement.classList.add("show");
                            this.strengthMessage = "";
                        }
                    }
                }
            };
            this.passwordInput.nativeElement.addEventListener("keyup", this.keyupHandler);
        }
        // Bootstrap tooltip initialization
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    ngOnDestroy(): void {
        if (this.passwordInput?.nativeElement && this.keyupHandler) {
            this.passwordInput.nativeElement.removeEventListener("keyup", this.keyupHandler);
        }
    }

    checkStrength(password: string, fieldPassWrap: HTMLElement): string {
        let strength = 0;
        const checksterngthdisplay = this.fieldPassWrap!.nativeElement;
        const textpassword = this.passwordText?.nativeElement; //null check

        if (password.length < 6 || password.length < 1) {
            if (this.fieldPassWrap!.nativeElement) {
                this.fieldPassWrap!.nativeElement.className = "";
                this.fieldPassWrap!.nativeElement.classList.add("check-strength", "short");
            }
            if (textpassword) {
                //null check
                textpassword.className = "";
                textpassword.classList.add("text-secondary", "small");
            }
            return "Too short";
        }

        if (password.length > 7) strength += 1;
        if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 1;
        if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) strength += 1;
        if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1;
        if (password.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1;

        if (strength < 2) {
            if (this.fieldPassWrap!.nativeElement) {
                this.fieldPassWrap!.nativeElement.className = "";
                this.fieldPassWrap!.nativeElement.classList.add("check-strength", "weak");
            }
            if (textpassword) {
                //null check
                textpassword.className = "";
                textpassword.classList.add("text-danger", "small");
            }
            fieldPassWrap.classList.remove("is-valid");
            return "This is a weak";
        } else if (strength === 2) {
            if (this.fieldPassWrap!.nativeElement) {
                this.fieldPassWrap!.nativeElement.className = "";
                this.fieldPassWrap!.nativeElement.classList.add("check-strength", "good");
            }
            if (textpassword) {
                //null check
                textpassword.className = "";
                textpassword.classList.add("text-warning", "small");
            }
            fieldPassWrap.classList.remove("is-valid");
            return "This is a good";
        } else {
            if (this.fieldPassWrap!.nativeElement) {
                this.fieldPassWrap!.nativeElement.className = "";
                this.fieldPassWrap!.nativeElement.classList.add("check-strength", "strong");
            }
            if (textpassword) {
                //null check
                textpassword.className = "";
                textpassword.classList.add("text-success", "small");
            }
            fieldPassWrap.classList.add("is-valid");
            return "Wow! It's a strong";
        }
    }
}
