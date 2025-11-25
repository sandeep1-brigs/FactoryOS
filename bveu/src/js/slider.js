import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { shared , s3PrivateUrl , s3PublicUrl  } from "./globals.js";
import { displaySection , showConfirmDialog , buildRequestOptions , isValidResponse , RequestOptions  } from "./capacitor-welcome.js";
import { showDialog , highlightHeaderTabMenu , fixModuleHeight , constructUrl , getSignedUrl , pauseVideos , initPinchZoom , getGeoPosition} from "./utility.js";
import { getMenuBar ,getNewToken } from "./settings.js";
import { exitModules , viewContent } from "./content.js";
import { createList } from "./list.js";
import { apiRequestFailed } from "./auth.js";
import { viewPdfFile } from "./pdfviewer.js";
import { getStyleAttributeInStyles } from "./ert.js";


let slides = []; // this selection is a live collection; any changes in DOM is updated in the variable unlike querySelectors
let currentSlideIndex = [];
let lastSlideIndex = [];
let timer = [];
let timerSpeedVal = [];
var delayTimer = null;
var maxHei = []

export async function initSlider(sectionIndex, delay, vertical) {
	
	timerSpeedVal[sectionIndex] = delay*1000;
	
	slides[sectionIndex] = document.getElementsByClassName("slide_"+sectionIndex);
	currentSlideIndex[sectionIndex] = 0;
	lastSlideIndex[sectionIndex] = slides[sectionIndex].length - 1;

    const leftBtn = document.createElement("button");
    const rightBtn = document.createElement("button");
    leftBtn.classList.add('sliderBtn', 'sliderLeftBtn');
    rightBtn.classList.add('sliderBtn', 'sliderRightBtn');
    document.getElementById("sliderContentArea_"+sectionIndex).appendChild(leftBtn);
    document.getElementById("sliderContentArea_"+sectionIndex).appendChild(rightBtn);
    $(leftBtn).on("click", function() {slideLeft(sectionIndex);});
    $(rightBtn).on("click", function() {slideRight(sectionIndex);});

    initSwipe(sectionIndex);

    var htmlStr = "";
    var index = 0;
    maxHei[sectionIndex] = 0;
    for(var slide of slides[sectionIndex]) {
        htmlStr += '<div id="sliderDot_'+sectionIndex+'_'+index+'" class="sliderNavDot sliderNavDot_'+sectionIndex+'" onclick="navigateSlide(this)"><i class="fas fa-circle"></i></div>';
        slide.id = 'slide_'+sectionIndex+'_'+index;

        index++;
        if(index == slides[sectionIndex].length) {
            $("#bannerNavigationDots_"+sectionIndex).html(htmlStr);

            if(slide.scrollHeight > maxHei[sectionIndex]) {
                maxHei[sectionIndex] = slide.scrollHeight;
                var sliderElem = document.getElementById("sliderContentArea_"+sectionIndex);
                sliderElem.style.height = parseInt(maxHei[sectionIndex])+20+"px";
            }

        }

        var imageElems = slide.getElementsByTagName('img');
        for(var image of imageElems) {
            if(image.complete && image.naturalHeight != 0) {
                if(slide.scrollHeight > maxHei[sectionIndex]) {
                    maxHei[sectionIndex] = slide.scrollHeight;

                    var sliderElem = document.getElementById("sliderContentArea_"+sectionIndex);
                    var minHeight = sliderElem.clientWidth * 11 / 32;
                    if(minHeight > maxHei[sectionIndex]) {maxHei[sectionIndex] = minHeight;}
                    //$('.slide_'+sectionIndex).height(maxHei[sectionIndex]+"px");
                    sliderElem.style.height = parseInt(maxHei[sectionIndex])+20+"px";
                }
            } else {
                image.onload = function() {
                    if(slide.scrollHeight > maxHei[sectionIndex]) {
                        maxHei[sectionIndex] = slide.scrollHeight;

                        var sliderElem = document.getElementById("sliderContentArea_"+sectionIndex);
                        var minHeight = sliderElem.clientWidth * 11 / 32;
                        if(minHeight > maxHei[sectionIndex]) {maxHei[sectionIndex] = minHeight;}
                        //$('.slide_'+sectionIndex).height(maxHei[sectionIndex]+"px");
                        sliderElem.style.height = parseInt(maxHei[sectionIndex])+20+"px";
            
                    }
                }
            }
        }

    }

	goToSlide(sectionIndex, currentSlideIndex[sectionIndex]);
	
	// If there are more than one slidesStart the Timeout timer for auto-run 
	if(lastSlideIndex[sectionIndex] > 0) {
		restartSlideTimer(sectionIndex, timerSpeedVal[sectionIndex]);

        $(".slide_"+sectionIndex).hover(function() {
            if (timer[sectionIndex]) {
                // Call clearTimeout() on hover()
                clearTimeout(timer[sectionIndex]);
            }
        }, function() {
            restartSlideTimer(sectionIndex, timerSpeedVal[sectionIndex]);
        });
	}
    return true;
}

function restartSlideTimer(sectionIndex, speedVal) {
    clearTimeout(timer[sectionIndex]); 
    timer[sectionIndex] = setTimeout(function() {updateSlider(sectionIndex, 1);}, speedVal);
}

function navigateSlide(that) {
    var splitArr = that.id.split('_');
    var sectionIndex = splitArr[1];
    var slideIndex = splitArr[2];

    var index = 0;
    for(var slide of slides[sectionIndex]) {
        if(slide.id == 'slide_'+sectionIndex+'_'+slideIndex) {
            goToSlide(sectionIndex, index);
            return 0;
        }
        index++;
    }
}

function slideLeft(sectionIndex) {
    if(currentSlideIndex[sectionIndex] > 0) {
        currentSlideIndex[sectionIndex]--;
        goToSlide(sectionIndex, currentSlideIndex[sectionIndex]);
    }
}

function slideRight(sectionIndex) {
    if(currentSlideIndex[sectionIndex] < lastSlideIndex[sectionIndex]) {
        currentSlideIndex[sectionIndex]++;
        goToSlide(sectionIndex, currentSlideIndex[sectionIndex]);
    }
}

// go to a slide;
function goToSlide(sectionIndex, slideIndex) {
    if(slides != null && slides.length > 0) {
        [...slides[sectionIndex]].forEach((s, i) => {
            s.style.transform = `translateX(${100 * (i - slideIndex)}%)`
        })
        currentSlideIndex[sectionIndex] = slideIndex;

        var actualSlideId = slides[sectionIndex][slideIndex].id;
        var actualSlideIndex = actualSlideId.split('_')[2];
        $(".sliderNavDot_"+sectionIndex).removeClass('currentBannerDot');
        var dotElem = document.getElementById('sliderDot_'+sectionIndex+'_'+actualSlideIndex);
        if(dotElem != null) {
            dotElem.classList.add("currentBannerDot");
        }

        if (((currentSlideIndex[sectionIndex] === lastSlideIndex[sectionIndex]) && (lastSlideIndex[sectionIndex] > 0)) ||
            (currentSlideIndex[sectionIndex] === 0)) {
        //    readyNextSlide(sectionIndex);
        }
        restartSlideTimer(sectionIndex, timerSpeedVal[sectionIndex]);
    }
}

// make ready the next slide if current slide is the first or the last slide
function readyNextSlide(sectionIndex) {
    // if currentSlide is the last slide, shift the first slide to the end
    if (currentSlideIndex[sectionIndex] === lastSlideIndex[sectionIndex]) {
        slides[sectionIndex][lastSlideIndex[sectionIndex]].insertAdjacentElement("afterend", slides[sectionIndex][0]);
        slides[sectionIndex][lastSlideIndex[sectionIndex]].style.transform = `translateX(${100}%)`;
        currentSlideIndex[sectionIndex]--; //this is because current slide is now the second last slide
    }
    // if currentSlide is the first slide, shift the last slide to the beginning
    else if (currentSlideIndex[sectionIndex] === 0) {
        slides[sectionIndex][0].insertAdjacentElement("beforebegin", slides[sectionIndex][lastSlideIndex[sectionIndex]]);
        slides[sectionIndex][0].style.transform = `translateX(-${100}%)`;
        currentSlideIndex[sectionIndex]++; //this is because current slide is now the second slide
    }
}


// put the last slide in the beginning; ('if' condition is not necessary but providing if condition is future proof if user sets the initial slide to be shown as the last slide )
//if (currentSlideIndex === lastSlideIndex || currentSlideIndex === 0) readyNextSlide();

// shift all slides left or right based on direction provided
function shiftSlides(sectionIndex, direction) {
    //direction ? currentSlideIndex[sectionIndex]++ : currentSlideIndex[sectionIndex]--;
    if(currentSlideIndex[sectionIndex] < lastSlideIndex[sectionIndex]) {
        currentSlideIndex[sectionIndex]++;
        goToSlide(sectionIndex, currentSlideIndex[sectionIndex]);
    }
	
}

function updateSlider(sectionIndex, direction) {
	shiftSlides(sectionIndex, direction);
}

function initSwipe(sectionIndex) {
    //$("#sliderContentArea_"+sectionIndex).on('swipeleft', function() {slideLeft(sectionIndex);});
    //$("#sliderContentArea_"+sectionIndex).on('swiperight', function() {slideRight(sectionIndex);});
    //$("#sliderContentArea_"+sectionIndex).off('touchstart', handleTouchStart);    // Clear previous handlers
    //$("#sliderContentArea_"+sectionIndex).off('touchmove', handleTouchMove);     // Clear previous handlers
    //$("#sliderContentArea_"+sectionIndex).off('touchend', handleTouchEnd);      // Clear previous handlers
    
    let sliderElem = document.getElementById('sliderContentArea_'+sectionIndex);
    $(sliderElem).unbind('touchstart');
    $(sliderElem).unbind('touchmove');
    $(sliderElem).unbind('touchend');
    $(sliderElem).on('touchstart', handleTouchStart);
    $(sliderElem).on('touchmove', handleTouchMove);
    $(sliderElem).on('touchend', handleTouchEnd);

    
    var xDown = null;                                                        
    var yDown = null;
    var xDiff = 0;
    var yDiff = 0;
    var slideOnProgress = false;

    function getTouches(evt) {
        return evt.touches ||             // browser API
            evt.originalEvent.touches; // jQuery
    }                                                     

    function handleTouchStart(evt) {
//    var handleTouchStart = function(evt) {touchStart(evt, arg);};
//    function touchStart(evt, arg){
        const firstTouch = getTouches(evt)[0];                                      
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
        xDiff = 0;
        slideOnProgress = false;
    };                                                
                                                                               
    function handleTouchMove(evt) {
//    var handleTouchMove = function(evt) {touchMove(evt, arg);};
//    function touchMove(evt, arg) {
        if ( ! xDown || ! yDown ) {
            return;
        }
    
        var xUp = evt.touches[0].clientX;                                    
        var yUp = evt.touches[0].clientY;
    
        xDiff = xDown - xUp;
        yDiff = yDown - yUp;
                                                                            
        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {  //most significant
        if ( xDiff > 10 ) {
            if(slideOnProgress == false) {
                slideOnProgress = true;
                slideRight(sectionIndex);
            }
            // down swipe
        } else if ( xDiff < -10 ) {
            if(slideOnProgress == false) {
                slideOnProgress = true;
                slideLeft(sectionIndex);
            }
            // up swipe
        } 
        } else {
            if ( yDiff > 0 ) {
                // down swipe
            } else { 
                // up swipe 
            }                                                                 
        }
        // reset values 
        xDown = null;
        yDown = null;                                             
    };

    function handleTouchEnd(evt) {
//    var handleTouchEnd = function(evt){touchEnd(evt, arg);};
//    function touchEnd(evt, arg) {
        //if ( xDiff > 0 ) {
        //slideRight(sectionIndex);
        //} else if ( xDiff < 0 ){
        //slideLeft(sectionIndex);
        //} 
        slideOnProgress = false;
    }

    function clearSwipeEvents() {
        document.removeEventListener('touchstart', handleTouchStart);        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }

}

window.initSlider = initSlider;
window.navigateSlide = navigateSlide;
window.readyNextSlide = readyNextSlide;
