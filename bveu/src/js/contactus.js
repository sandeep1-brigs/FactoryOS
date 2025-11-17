import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Haptics, ImpactStyle } from '@capacitor/haptics';


import { shared } from "./globals.js";
import { showDialog, initAppRuntimeMonitor, closeDialogBox, constructUrl, convertVersionVal, fixModuleHeight } from "./utility.js";
import { displaySection, buildRequestOptions, RequestOptions, isValidResponse, showConfirmDialog } from "./capacitor-welcome.js";
import { viewLogin, apiRequestFailed } from "./auth.js";

function contactUs() {
    $('#contactUsSection').css('display', 'block');
    var htmlContent = '';

    htmlContent += '<input type="hidden" id="contactus_userId"/>';
    htmlContent += '<input type="text" id="contactus_fullname" class="contactUsInput" placeholder="Full Name"/>';
    htmlContent += '<input type="text" id="contactus_company" class="contactUsInput" placeholder="Company"/>';
    htmlContent += '<input type="number" id="contactus_phone" class="contactUsInput" placeholder="Phone No"/>';
    htmlContent += '<input type="text" id="contactus_email" class="contactUsInput" placeholder="Email"/>';
    htmlContent += '<textarea id="contactus_message" class="contactUsInput" placeholder="Message"></textarea>';

    htmlContent += '<button id="contactusSubmitBtn" class="moduleButton" onclick="submitContactUsForm()" style="width:fit-content; padding:0 75px; margin: 20px auto;">SUBMIT</button>';
    $('#contactUsWindow').html(htmlContent);

    if(shared.mCustomerDetailsJSON != null) {
        $('#contactus_userId').val(shared.mCustomerDetailsJSON.id);
        $('#contactus_fullname').val(shared.mCustomerDetailsJSON.firstName+' '+shared.mCustomerDetailsJSON.lastName);
        $('#contactus_company').val(shared.mCustomerDetailsJSON.companyKey.split('_').pop());
    }
}

function closeContactUs() {
    $('#contactUsSection').css('display', 'none');
}

async function submitContactUsForm() {
    try {
        // Read form fields (same as Cordova)
        const userId = document.getElementById('contactus_userId').value;
        const name = document.getElementById('contactus_fullname').value;
        const company = document.getElementById('contactus_company').value;
        const phone = document.getElementById('contactus_phone').value;
        const email = document.getElementById('contactus_email').value;
        const message = document.getElementById('contactus_message').value;

        // Construct email body (exact Cordova logic)
        const contactUsData =
            `User Id: ${userId}, Name: ${name}, Company: ${company}, Phone: ${phone}, Email: ${email}, Message: ${message}`;

        // Show loader if needed
        // document.getElementById('loadingmessage').style.display = 'block';

        // Send email using SMTPJS (same as Cordova)
        await Email.send({
            SecureToken: shared.systemConfiguration.systemInfo.smtpSecureToken,
            // Or, alternatively, if you use SMTP credentials instead of token:
            // Host: systemConfiguration.systemInfo.emailHost,
            // Username: systemConfiguration.systemInfo.emailSenderUserName,
            // Password: systemConfiguration.systemInfo.emailSenderUserPassword,

            To: shared.systemConfiguration.systemInfo.contactUsEmailAddress,
            From: shared.systemConfiguration.systemInfo.emailSenderUserName,
            Subject: "Contact US - From BVeU App",
            Body: contactUsData
        });

        // Hide loader
        // document.getElementById('loadingmessage').style.display = 'none';

        // Show success message
        showDialog("Thank you for your message. We'll get back to you soon!", "closeContactUs()");

    } catch (error) {
        console.error("Error sending email:", error);
        // document.getElementById('loadingmessage').style.display = 'none';
        showDialog("Failed to send message. Please try again later.", "closeContactUs()");
    }
}

window.contactUs = contactUs;
window.closeContactUs = closeContactUs;
window.submitContactUsForm = submitContactUsForm;