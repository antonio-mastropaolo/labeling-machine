const delay = ms => new Promise(res => setTimeout(res, ms));

function get_elapsed_seconds() {
    var date_now = new Date();
    var time_now = date_now.getTime();
    var time_diff = time_now - startTime;
    var seconds_elapsed = Math.floor(time_diff / 1000);

    startTime = (new Date()).getTime(); //reset timer

    return (seconds_elapsed);
}

function skip_next_artifact() {
    if (confirm('Are you sure?')) {
        window.location.pathname = '/labeling';
    }
}



function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function ChangeSkipToNext() {
    $("#next-skip-btn").text("Next");
    $("#next-skip-btn").removeClass("btn-outline-success");
    $("#next-skip-btn").addClass("btn-success");
    window.location.pathname = '/labeling';
}


function createNewCategory() {
    var newCategoryName = prompt("Please type the new comment category name","Text");
    var newCategoryDescription =  prompt("Please type the new comment category description","");
    if (newCategoryDescription === null || newCategoryName === null || newCategoryDescription === "" || newCategoryName === "") {
        var tag = document.createElement("div");
        tag.setAttribute('class','alert alert-danger alert-fixed');
        tag.setAttribute('role','alert');
        tag.setAttribute('id','alertCategory')
        tag.setAttribute('style','font-size:large; text-align:center; width:20%;');
        tag.innerText = 'Both fields must be filled!';

        try{
            $("#alertCategory").remove()
        }catch (ex){}

        $('#alert').append(tag);
        $('#alertCategory').fadeIn(1000);
           setTimeout(function() {
               $('#alertCategory').fadeOut(1000);
               }, 2000);

        return;
    }
    //var buttonID = dictRes['category_name'].replace(/\s/g, '');+'-button';
    userDefinedNewCategoryNames.push(newCategoryName);
    userDefinedNewCategoryDescriptions.push(newCategoryDescription);
    return {'category_name':newCategoryName,'description':newCategoryDescription};

}



function moveToSelectedMethod(indexClassification, onlyAnimation=true, methodIndex){


    methodUnderClassification = 'button-method-'+methodIndex;
    commentsForTheMethodUnderClassification = parseInt(numberOfCommentsPerMethod[methodIndex]);

    var arr = Array.from(comments);
    indexComment = dictHighlightedCommentsPosition[indexClassification].toString();
    var selectedComments = indexComment.split(',');
    for(var i=0; i<selectedComments.length; i++){
        var tagSelector = arr[selectedComments[i]];
        try {
            $(tagSelector)[0].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
            $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
                $(this).removeClass('animationLabel').dequeue();
            });
        }
        catch(ex){}
    }

    if(!onlyAnimation) {
        resetColorHighlightingCategories();
        highlightSelectedCategoryButton(indexClassification);
        setTimeout(function () {
            resetColorHighlightingCategories();
        }, 1500); //in millisecond
    }

}

function moveToSelectedMethodFromLine(lineNumber, buttonID){

    for (var i=0; i<methodsList.length; i++){
        var item = methodsList[i].split('-')[0]
        if (parseInt(lineNumber) === parseInt(item) ){
            commentsForTheMethodUnderClassification = parseInt(numberOfCommentsPerMethod[i]);
        }
    }

    methodUnderClassification = buttonID;

    var tagSelector = $(`.row-line:contains(${lineNumber})`);
    $(tagSelector)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    $(tagSelector).addClass('animationLabel').delay(5000).queue(function () {
        $(this).removeClass('animationLabel').dequeue();
    });
}

// Function adapted from: https://stackoverflow.com/questions/6240139/highlight-text-range-using-javascript
function highlightRangeNew(start, end){

    let cur = 0;
    let replacements = [];

    var selector = document.getElementById("code");

    function dig(node){
        if (node.nodeType === 3) {
            let nodeLen = (node).data.length;
            let next = cur + nodeLen;
            if (next > start && cur < end) {
                let pos = cur >= start ? cur : start;
                let len = (next < end ? next : end) - pos;
                if (len > 0) {
                    if (!(pos === cur && len === nodeLen && node.parentNode &&
                        node.parentNode.childNodes && node.parentNode.childNodes.length === 1 &&
                        (node.parentNode).tagName === 'SPAN' && (node.parentNode).className === 'highlight1')) {

                        replacements.push({
                            node: node,
                            pos: pos - cur,
                            len: len,
                        });
                    }
                }
            }
            cur = next;
        }
        else if (node.nodeType === 1) {
            let childNodes = node.childNodes;
            if (childNodes && childNodes.length) {
                for (let i = 0; i < childNodes.length; i++) {
                    dig(childNodes[i]);
                    if (cur >= end) {
                        break;
                    }
                }
            }
        }
    }

    $(selector).each(function (index, element){
        dig(element);
    });


    let highlightedSection = [];

    for (let i = 0; i < replacements.length; i++) {
        let replacement = replacements[i];
        let highlight = document.createElement('span');
        if(isLabeled==0) { highlight.setAttribute("id", "highlight-" + dictIndex); }
        else{ highlight.setAttribute("id", "highlight-" + currentClassification);}
        highlight.setAttribute("style", "background-color: #FFE5CC");
        let wordNode = replacement.node.splitText(replacement.pos);
        wordNode.splitText(replacement.len);
        let wordClone = wordNode.cloneNode(true);
        highlight.appendChild(wordClone);
        wordNode.parentNode.replaceChild(highlight, wordNode);
        highlightedSection.push(highlight);
    }

    unselectAll();
    return highlightedSection;
}

function moveToSelectedMethodFromTag(indexComment, indexClassification) {

    //unlock code section
    $("#code").css('user-select','');

    //activate the previously disabled save and clear button
    $("#saveClassification").removeAttr('disabled');
    $("#clearText").removeAttr('disabled');

    if ($("#clearText").text().trim() === 'Reset'){
        $("#clearText").text('Change');
    }

    var arr = Array.from(comments);
    indexComment = indexComment.toString();
    var selectedComments = indexComment.split(',');
    //var tagSelector = arr[selectedComments[0]];
    currentClassification = indexClassification;

    for(var i=0; i<selectedComments.length; i++){
        var tagSelector = arr[selectedComments[i]];
        //console.log(tagSelector);
        try {
            $(tagSelector)[0].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
            $(tagSelector).addClass('animationLabel').delay(500).queue(function () {
                $(this).removeClass('animationLabel').dequeue();
            });
        }
        catch(ex){}
    }

    highlightSelectedCategoryButton(currentClassification);


    for (const [key, value] of Object.entries(dictSelectedCode)) {
          if (key === indexClassification){ continue; }
          else{ $('#association-'+key).attr('disabled','disabled'); }
    }


    ////////////////////////////////////////////////////
    //Highlight the selected comment

    for(var j=0;j<selectedComments.length;j++) {

        currentIndexComment = Number(j);
        // We highlight the previously made classification
        const position = dictHighlightedCommentsPosition[indexClassification][currentIndexComment];
        $(comments[position]).css('color', 'red').attr('id','comment-highlight-'+currentClassification);
        highlightedCommentsInReviewing.push(comments[position]);
        var lines = $(comments[position]).text().split('\n');
        for (var k = 0; k < lines.length; k++) {
            updateTextArea('<span class="selected-comment">' + escapeHtml(lines[k]) + '</span>');
        }

    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    //Highlight the selected code
    try{
        for(var i=0;i<dictHighlightedCodeCharacterPosition[currentClassification].length;i++) {

            var start = Number(dictHighlightedCodeCharacterPosition[currentClassification][i].split('-')[0]);
            var end = Number(dictHighlightedCodeCharacterPosition[currentClassification][i].split('-')[1]);


            if (start === 0 || end === 0) {
                continue;
            }

            highlightRangeNew(start, end);
        }
    }catch(ex){}

    // semi-column heuristic to reconstruct and display the highlighted code correctly

    var spanSelector = "[id=highlight-"+(currentClassification)+"]";
    var concatenedString = ''
    var previousString = ''

    // we should find a nice way to highlight the selected text
    for(var j=0; j < $(spanSelector).length; j++) {
        concatenedString = concatenedString + $(spanSelector)[j].innerText;
    }
    updateTextArea('<span class="selected-code">' +escapeHtml(concatenedString) + '</span>');

}

function highlightTargetComments(elements,className){
    var dictPosition = {}
    function look4Javadoc(comment){
        var commentLines = comment.split('\n');

        if(commentLines.length>=2) {
            if (commentLines[0].trim().startsWith('/*') && commentLines[1].trim().startsWith('*')) {
                return false;
            }
        }
        for(var i=0;i<commentLines.length;i++){
            if(commentLines[i].trim().startsWith('*') && !commentLines[i].trim().startsWith('*/')){
                return true
            }
        }
        return false;
    }

    for(var i=0;i<elements.length;i++){
        if(elements[i].innerHTML.startsWith('/**') || elements[i].innerHTML.startsWith('/* *') || look4Javadoc(elements[i].innerHTML)){
            //console.log('hit javadoc');
            continue
        }
        else{
             dictPosition = fakeSelection4Comment(elements[i]);
             //if(isCommentInRange(dictPosition,spanOfCharPerMethod)) { $(elements[i]).addClass(className);}
             $(elements[i]).addClass(className);

        }
    }

}


function fakeSelection4Comment(element){
    var codeSection = document.getElementById("code");
    var range, start, end, text;
    range = document.createRange();
    range.setStart(codeSection,0);
    range.setEnd(element,0);
    start = range.toString().length //- text.length;

    range = document.createRange();
    range.selectNode(element);
    window.getSelection().addRange(range);
    text = range.toString();
    end = start + text.length;

    return {'start':start,'end':end};

}

function getSelectionCharOffsetsWithin(element) {
    var start = 0, end = 0, text = "";
    var sel, range, priorRange, serializedRange;
    if (typeof window.getSelection != "undefined") { // Non-IE
        if (window.getSelection().toString() != "") {
            range = rangy.getSelection().getRangeAt(0);
            priorRange = range.cloneRange();
            priorRange.selectNodeContents(element);
            priorRange.setEnd(range.startContainer, range.startOffset);
            start = priorRange.toString().length;
            end = start + range.toString().length;
            // Get text
            text = range.toString();
            serializedRange = rangy.serializeRange(range,true);
        }
    } else if (typeof document.selection != "undefined" && (sel = document.selection).type != "Control") {  // IE
        range = sel.createRange();
        priorRange = document.body.createTextRange();
        priorRange.moveToElementText(element);
        priorRange.setEndPoint("EndToStart", range);
        start = priorRange.text.length;
        end = start + range.text.length;
        // Try with IE
        text = range.text;
    }

    //handling click event on the right side of the text area
    try{
        targetTag = range.commonAncestorContainer;
    }catch(e){
        targetTag = null;
    }

    return {
        start: start,
        end: end,
        text: text,
        targetTag: targetTag,
        range: range,
        serializedRange: serializedRange
    };
}

function reset(save=false){

    $("#textAreaSelectedText").text("");
    $('.category-button').css("background-color",'');
    //$("#new-category-button").text("Define New Category");

    if(!save) {
        if(isLabeled==0){
            var spanSelector = "[id=comment-highlight-" + (dictIndex) + "]";
            $(spanSelector).css('color', '');

            //Restore overlapping comments that have been deselected
            for (const [key, value] of Object.entries(dictHighlightedCommentsPosition)) {
               for (var i=0; i<value.length; i++){
                   $(comments[value[i]]).css('color', 'green').attr('id','comment-highlight-'+key);
               }
            }


            resetHighlightedCode(dictHighlightedCode[dictIndex], dictIndex);
        }


        if(isLabeled==1){
            //reset comment
            var spanSelector = "[id=comment-highlight-" + (currentClassification) + "]";
            $(spanSelector).css('color', '');

            //reset code
            spanSelector = "[id=highlight-"+(currentClassification)+"]";
            $(spanSelector).css('background-color','').attr("id","old-span");

            //Restore overlapping comments that have been deselected
            // for (const [key, value] of Object.entries(dictHighlightedCommentsPosition)) {
            //    for (var i=0; i<value.length; i++){
            //        $(comments[value[i]]).css('color', 'green').attr('id','comment-highlight-'+key);
            //    }
            // }

        }

    }

    if(isLabeled==1 && save){

        //Disable Save and Reset button until the user click on the first association
        $("#saveClassification").attr('disabled','disabled');
        $("#clearText").attr('disabled','disabled');


        //changing previous span token(highlighting) with the green one
        var selector = "[id=highlight-"+(currentClassification)+"]";
        $(selector).css('background-color','#CCFFE5');


        //removing highlighting from the comment
        changeCommentHighlighting(null,'green', false);
        $("#association-"+currentClassification).fadeOut(300, function(){ $(this).remove();});
        if(counterAssociations==0){
            ShowNotification('You have reviewed all the instances....Please submit the new classification','success', 500);
        }

    }else if(isLabeled==0 && save){
        var selector = "[id=highlight-"+(dictIndex)+"]";
        $(selector).css('background-color','');

        //changing highlighting for the comment and code
        changeCommentHighlighting(commentEleToHighlight, 'green', false);
        for(var i=0;i< highlightedCodeDuringSelection.length;i++){
            $(highlightedCodeDuringSelection[i]).css('background-color','#CCFFE5');
        }
    }

    //deactivate button until the changes are completed and brought to the staging area
    if(isLabeled==1 && flagSwitch){
        //$("#clearText").attr('disabled','disabled');
        $("#clearText").text('Reset');
        var bSelector = `#${selectedCategories[currentIndexComment]}`;
        $(bSelector).css('background-color','');
        changingToClassificationOnGoing=true; //the reviewer is about to change the classification
        flagSwitch=false;
    }

    commentEleToHighlight = [];
    commentIndex = [];
    highlightedCommentsInReviewing = [];
    highlightedCodeDuringSelection = [];
    beginningCommentCharacterPosition = [];
    endCommentCharacterPosition = [];
    listSelectedSpanCode = [];
    listSelectedSpanComment = [];
    resetClicked = false;

    // Restore original color for the no-code-button and network-code-button
    noCode=false;
    $("#no-code-button").css('background-color','#8267BE');

    isForNN=0;
    $("#network-code-button").css('background-color','#8267BE');

    selectedCategory = "";
    selectedCodeText = "";
    methodUnderClassification = "";
    selectedCommentText = "";
    selectedComments = [];
    selectedCategories = [];
    selectedCode = [];


    unselectAll();
}

function resetHighlightedCode(customList=null, targetItem){
    var item='highlight-'+targetItem;
    $(`span[id=${item}]`).css('background-color','');
}

function changeCommentHighlighting(customList, color, reset=false){
    //console.log(customList);
    if(isLabeled === 0) {
       for (var i = 0; i < customList.length; i++) {
            $(customList[i][0]).css('color', color);
        }
    }else if (isLabeled === 1){
        if(commentEleToHighlight.length==0) { commentEleToHighlight = highlightedCommentsInReviewing; }
        for(var i=0;i<commentEleToHighlight.length;i++){

            if(!reset) { $(commentEleToHighlight[i]).css('color','green'); }
            else       { $(commentEleToHighlight[i]).css('color',''); }
        }

    }
}

function checkForButtonValidity(){

    var textBoxTags = $("#textAreaSelectedText").children();
    for(var i=0;i<textBoxTags.length;i++){

        if( $(textBoxTags[i]).hasClass('selected-comment')){
            //console.log('ok!');
            return true;
        }
    }
    return false;
}

function updateTextArea(textToDisplay){
    $("#textAreaSelectedText").append(textToDisplay);
}

function removeNewAddedCategory(element){

    onMouseLeaveEvent(element);

    var keys = Object.keys(dictSelectedCategories);
    var skip=false;

    keys.forEach(function(key){
        if(dictSelectedCategories[key].includes(element)){
            alert('This action is forbidden. Please remove first the association you made!');
            skip=true;
        }
    });

    if(!skip) {
        $("#" + element)[0].parentNode.remove();
        var index = selectedCategories.indexOf(element);
        selectedCategories[index] = null;
        userDefinedNewCategoryNames.reverse().pop();
        userDefinedNewCategoryDescriptions.reverse().pop();
        userDefinedCategoryShortcuts.reverse().pop();
        badgeCounterCategory -= 1;
    }

    // console.log('**************************');
    // console.log(userDefinedNewCategoryNames);
    // console.log(userDefinedNewCategoryDescriptions);
    // console.log('**************************');

}

function addNewCommentToBeLinked(element){

    var retCode=checkForButtonValidity();
    if (!retCode) { return false;}
    
    if(element.id.toString() === "new-category-button") {
        var dictRes = createNewCategory();

        var shortcut = (userDefinedCategories['category_id'].length+badgeCounterCategory);
        userDefinedCategoryShortcuts.push(shortcut);
        
        var tag = document.createElement("div");
        var buttonID = (dictRes['category_name'].split(' ').join('')).toLowerCase()+'-button';
        tag.setAttribute('onmouseenter','onMouseEnterEvent("' + buttonID + '","' + dictRes['description'] + '");');
        tag.setAttribute('onmouseleave','onMouseLeaveEvent("' + buttonID + '" );');
        tag.setAttribute('class', 'buttonWrapper');

        var newButton = document.createElement('button');
        newButton.setAttribute('class', 'btn btn btn-secondary category-button')
        newButton.setAttribute('type', 'submit');
        newButton.setAttribute('id', buttonID);
        newButton.setAttribute('style', 'width: 100%; text-align: left;');
        //newButton.innerHTML = +shortcut+'</span>'+dictRes['category_name'];
        newButton.innerHTML = '<span style="font-size: 12px;" class="badge bg-secondary float-right position-relative">' + "ALT+CTRL+"+shortcut+'</span>'+dictRes['category_name'];
        var newTrashButton =  document.createElement('i');
        newTrashButton.setAttribute('class','far fa-trash-alt fa-1x');
        newTrashButton.setAttribute('style','position:relative; left:45%; top:-5px;');
        newTrashButton.setAttribute('onclick','removeNewAddedCategory("' + buttonID +'");');

        newButton.appendChild(newTrashButton);
        tag.appendChild(newButton);
        $("#categoriesColumn").append(tag);
        selectedCategory = buttonID;
        $(newButton).css('background-color','green');
        badgeCounterCategory += 1;
    }else{
        $(element).css('background-color','green');
        selectedCategory = element.id.toString();
        if(selectedCategory === 'code-summary-button'){
            $('#network-code-button').css('background-color','green');
        }
    }
    selectedCategories.push(selectedCategory);
}



function isSelectedCategory(){
    if(noCode){
        return true;
    }else{
        if(selectedCategory=="" && isLabeled==0){ //we accept commented code without any code snippet associated
            alert("First link the given comment to the snippet!");
            changeCommentHighlighting(dictHighlightedCode[counterAssociations]);
            return false;
        }else{
            return true;
        }
    }
}


function saveCategorization(){

    dictHighlightedCode[counterAssociations] = highlightedCodeDuringSelection;

    if (commentEleToHighlight.length > 0 ) {  dictHighlightedComments[counterAssociations] = commentEleToHighlight; }

    if (isSelectedCategory()){
        //save snippet
        var flag=false;
        var childNodes = document.getElementById("textAreaSelectedText").childNodes;
        for(var i = 0; i < childNodes.length; i++){
            if( $(childNodes[i])[0].className === "selected-code" || noCode){
                flag=true;
                break;
            }
        }
        if(!flag){
            alert("First link the given comment to the snippet!");
            return false;
        }

        $("#textAreaSelectedText").text("");
        for(var i=0;i<labelCategories.length;i++){
            var selector="#"+labelCategories[i];
            $(selector).css('background-color','');
        }

        if(isLabeled === 0) {

            //adding tag result to the lists we store in the DB

            dictHighlightedCommentsPosition[dictIndex] = [...new Set(commentIndex)];
            dictHighlightedCommentsCharacterPosition[dictIndex] = [...new Set(listSelectedSpanComment)];

            if(listSelectedSpanCode.length === 0){ dictHighlightedCodeCharacterPosition[dictIndex] = [-1];}
            else{ dictHighlightedCodeCharacterPosition[dictIndex] = listSelectedSpanCode; }

            if(selectedCode.length>0) {
                dictSelectedCode[dictIndex] = selectedCode.filter(function (e) {
                    return e
                });
            }else{
                dictSelectedCode[dictIndex] = [-1];
            }

            if(selectedComments.length>0) {
                selectedComments = [...new Set(selectedComments)];
                dictSelectedComment[dictIndex] = selectedComments.filter(function (e) {
                    return e
                });
                selectedCommentText = dictSelectedComment[dictIndex].join('\n');
                //console.log(selectedCommentText);
            }

            if(selectedCategories.length>0) {
                dictSelectedCategories[dictIndex] = selectedCategories.filter(function (e) {
                    return e
                });
            }

            //Add new association button
            var divID = "div-association" + '-' + dictIndex;
            var buttonID = "association" + '-' + dictIndex;
            var buttonText = "Association: #" + dictIndex;

            var methodIndex = -1;

            if(methodUnderClassification === ''){
                methodIndex = retrieveMethodUnderClassification(listSelectedSpanComment);
                methodUnderClassification = 'button-method-'+methodIndex;
                commentsForTheMethodUnderClassification = parseInt(numberOfCommentsPerMethod[methodIndex]);
                //console.log(commentsForTheMethodUnderClassification);
            }else{
                 var items = methodUnderClassification.split('-');
                 methodIndex = items[items.length-1];
            }
            //console.log('DEBUG:');
            // console.log('Method Under Classification: ' +methodUnderClassification);
            // console.log('method index: '+methodIndex);
            // console.log(comment2Method[methodIndex]);

            if(selectedCommentText.trimLeft().startsWith('/*')){
                mapAssociation2Comment[divID] = 1
            }else {
                mapAssociation2Comment[divID] = getCommentLength(selectedCommentText);
            }

            //updateComment2CodeMap(dictHighlightedCommentsCharacterPosition, selectedComments, dictIndex, methodIndex);
            comment2Method[methodIndex] = comment2Method[methodIndex] + mapAssociation2Comment[divID];
            if (comment2Method[methodIndex] >= commentsForTheMethodUnderClassification){
                $("#"+methodUnderClassification).css('background-color','green');
            }

            //var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + dictIndex + ");" +  "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-check fa-2x" style="position:sticky; left:95%;" </i></button></div>';

            var newButton = '<div class="buttonWrapper" id="' + divID + '"> <button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick="'+ "moveToSelectedMethod(" + dictIndex + ", " + false + ", " + methodIndex +"  );" + "" + '" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '<i class="far fa-trash-alt fa-2x" style="position:sticky; left:95%;" onclick="moveToSelectedMethod( '+ dictIndex +', ' + true + ' ); removeAssociation( \'' + methodUnderClassification + '\', \''+ divID +'\',  ' + methodIndex + '  )"></i></button></div>';
            //onclick="removeAssociation(\''+ divID +'\')">

            // handling list for the reviewing part
            var moveToButton = '<div class="buttonWrapper" id="' + divID + '"><button class="btn btn btn-dark" type="submit" id="' + buttonID + '" onclick=" moveToSelectedMethodFromTag([' + dictHighlightedCommentsPosition[dictIndex] + '],' +dictIndex + ');" style="width: 100%; display: inline-flex; align-items: left;">' + buttonText + '</button></div>';
            methodSelectionButton.push(moveToButton);


            dictIndex += 1;
            counterAssociations = counterAssociations + 1;
            $("#badgeCounter").text(counterAssociations);
            $("#lowerSide" ).append( $(newButton) );

        }

        //Bringing back the change button and remove selectionButton
        if(isLabeled === 1 && currentClassification>=0){

            if (commentIndex.length > 0)            { dictHighlightedCommentsPositionRev[currentClassification] = [...new Set(commentIndex)];  } //duplicates deletion due to mis-selection event
            if (listSelectedSpanCode.length > 0)    { dictHighlightedCodeCharacterPositionRev[currentClassification] = listSelectedSpanCode; }
            if (listSelectedSpanComment.length > 0) { dictHighlightedCommentsCharacterPositionRev[currentClassification] = [...new Set(listSelectedSpanComment)]; }
            if (selectedCode.length > 0)            { dictSelectedCodeRev[currentClassification] = selectedCode.filter(function(e){return e}); }
            if (selectedComments.length > 0 )       { dictSelectedCommentRev[currentClassification] = selectedComments.filter(function(e){return e}); }
            if (selectedCategories.length > 0)      { dictSelectedCategoriesRev[currentClassification] = [...new Set(selectedCategories)]; dictSelectedCategoriesRev[currentClassification] = dictSelectedCategoriesRev[currentClassification].filter(function(e){return e}); }

            // console.log(dictSelectedCategoriesRev[currentClassification]);
            // console.log('before');
            // console.log(dictSelectedCodeRev[currentClassification]);

            //function check4Conflict(commentLabeler, categoriesLabeler, codeLabeler, commentReviewer, categoriesReviewer, codeReviewer){
            var isConflict = check4Conflict(dictSelectedComment[currentClassification],dictSelectedCommentRev[currentClassification],
                                            dictSelectedCategories[currentClassification], dictSelectedCategoriesRev[currentClassification],
                                            dictSelectedCode[currentClassification], dictSelectedCodeRev[currentClassification]);

            conflicts[currentClassification]=isConflict;

            if(dictHighlightedCommentsPositionRev[currentClassification].length === 0){
                dictHighlightedCommentsPositionRev[currentClassification] = dictHighlightedCommentsPosition[currentClassification];
            }


             if(dictSelectedCategoriesRev[currentClassification].length === 0 ){
                dictSelectedCategoriesRev[currentClassification] = dictSelectedCategories[currentClassification];
            }

            if(dictSelectedCommentRev[currentClassification].length === 0){
                dictSelectedCommentRev[currentClassification] = dictSelectedComment[currentClassification];
            }

            if(dictHighlightedCommentsCharacterPositionRev[currentClassification].length === 0 ){
                dictHighlightedCommentsCharacterPositionRev[currentClassification] = dictHighlightedCommentsCharacterPosition[currentClassification];
            }

            //Handling no-code case

            if(dictSelectedCategoriesRev[currentClassification].includes('no-code-button')){
                dictSelectedCodeRev[currentClassification]=[-1];
                dictHighlightedCodeCharacterPositionRev[currentClassification] = [-1];
            }else{
                if(dictSelectedCodeRev[currentClassification].length === 0){
                    dictSelectedCodeRev[currentClassification] = dictSelectedCode[currentClassification]
                    dictHighlightedCodeCharacterPositionRev[currentClassification] = dictHighlightedCodeCharacterPosition[currentClassification];
                }else{
                    //nothing
                }
            }

            // Done handling no code case

            //console.log('after');
            //console.log(dictSelectedCodeRev[currentClassification]);

            $("#clearText").text('Change');

            //unlock next association button
            const elementToUnlock = associationsList.shift();
            $('#association-'+elementToUnlock).removeAttr('disabled');

            flagSwitch=false;
            counterAssociations = counterAssociations - 1;
            $("#badgeCounter").text(counterAssociations);

            //lock code section
            $("#code").css('user-select','none');


        }
        //console.log('--> ' +isForNN);
        reset(save=true);

        //check if ready to Submit
        // var associationsSoFar = howManyAssociations()
        // if(numberOfCommentsPerClass === associationsSoFar){
        //     alert('Each Comment has been tagged! Ready to Submit!');
        // }
    }


}

function unselectAll(){
    if (document.selection && document.selection.empty)
    {
        document.selection.empty();
    }
    else if (window.getSelection)
    {
        var sel= window.getSelection();
        if(sel && sel.removeAllRanges)
            sel.removeAllRanges();
    }
}

function commentWithin(text){
    var lines = text.split('\n');
    for(var i=0;i<lines.length;i++){
        if(lines[i].trim().startsWith('//')){
            return true;
        }
    }
    return false;
}


function removeAssociation(method, divID, methodIndex){
    var targetAssociation = divID.split('-')[2];
    $('#'+divID).fadeOut(300, function(){ $(this).remove();});
    counterAssociations = counterAssociations -1;
    $("#badgeCounter").text(counterAssociations);

    //removing highlighting for code and comment
    resetHighlightedCode($(dictHighlightedCode[targetAssociation]),targetAssociation);
    var spanSelector = "[id=comment-highlight-"+(targetAssociation)+"]";
    $(spanSelector).css('color','');

    resetColorHighlightingCategories();

    dictHighlightedCommentsPosition[targetAssociation] = [];
    dictHighlightedCodeCharacterPosition[targetAssociation] = [];
    dictHighlightedCommentsCharacterPosition[targetAssociation] = [];

    dictSelectedCode[targetAssociation] = [];
    dictSelectedCategories[targetAssociation] = [];
    dictSelectedComment[targetAssociation] = [];
    methodSelectionButton[targetAssociation] = '';
    selectedComments = [];
    selectedCategories = [];
    selectedCode = [];

    //remove association liking a comment of len
    // console.log('MAPPA PRE: ');
    // console.log(comment2Method[methodIndex]);
    // console.log("Selected Comment so far: "+comment2Method[targetAssociation]);
    // console.log('target association: '+targetAssociation);
    // console.log('MapAss2Comment: ' +mapAssociation2Comment[divID]);

    comment2Method[methodIndex] = comment2Method[methodIndex] - mapAssociation2Comment[divID];

    //quick fix
    if(comment2Method[methodIndex] < 0 ){
        comment2Method[methodIndex]=0;
    }
    // console.log('MAPPA AFTER: ');
    // console.log(comment2Method[methodIndex]);

    $("#"+method).css('background-color','');
    methodUnderClassification = "";
    isForNN=0;
}

function refreshPage(){
    if (confirm('Are you sure?')) {
        window.location.reload();
    }
}

function cleanDict(obj) {
  for (var propName in obj) {
    if (obj[propName].length === 0 || obj[propName] === undefined || obj[propName] === null) {
      delete obj[propName];
    }
  }
  return obj
}

function getSameKeysDict(dict1, dict2){
    var newRefinedDict = {}
    for (const [key1, value1] of Object.entries(dict1)) {
        for (const [key2, value2] of Object.entries(dict2)) {
            if(key1 === key2){
                newRefinedDict[key2]=value2;
                break;
            }
        }
    }
    return newRefinedDict;
}


function resetColorHighlightingCategories(){
    //removing categories highlighting
    var elements = document.getElementsByClassName("buttonWrapper");
    for(var i=0;i<elements.length;i++){
        if ( $(elements[i].childNodes[1]).hasClass('category-button')){ $(elements[i].childNodes[1]).css('background-color','');}
        if ( $(elements[i].childNodes[0]).hasClass('category-button') ) {  $(elements[i].childNodes[0]).css('background-color','');}

    }

    $("#no-code-button").css('background-color','#8267BE');
    $("#network-code-button").css('background-color','#8267BE');
}

function highlightSelectedCategoryButton(index){
    //highlight the select button category
    for(var i=0; i<dictSelectedCategories[index].length; i++){
        $("#"+dictSelectedCategories[index][i]).css('background-color','green');
        if(dictSelectedCategories[index][i] === 'no-code-button'){
            noCode=true;
        }
        if(dictSelectedCategories[index][i] ==='network-code-button'){
            isForNN=1;
        }
    }
}

function onMouseEnterEvent(category,description){
    category = category.split('-')[0];
    var myDiv = document.createElement('div');
    myDiv.setAttribute('class', 'popUpCategory');
    myDiv.setAttribute('id', "pop-up-"+category);
    myDiv.innerHTML = description;
    document.body.appendChild(myDiv);
}

function onMouseLeaveEvent(btnCategory){
    var category = btnCategory.split('-')[0];
    $("#pop-up-"+category).remove();
}

function fetchUserDefinedCategoryButtonName(shortcut){
    for(var i=0; i<userDefinedCategories['category_id'].length; i++) {
        if( parseInt(userDefinedCategories['shortcut'][i]) === shortcut ){
            return userDefinedCategories['category_button_name'][i];
        }
    }
}


function isAlreadySelectedCategory(categoryButton){
    var color = $("#"+categoryButton).css('background-color');
    if(color === "rgb(0, 128, 0)"){
       return true;
    }else{
        return false;
    }
}


function selectDeselectViaShortcut(categoryButtonName){

    if(isAlreadySelectedCategory(categoryButtonName)){
        var index = selectedCategories.indexOf(categoryButtonName);
        selectedCategories.splice(index, 1);
        //selectedCategory = "";
        if(categoryButtonName === 'no-code-button'){
            noCode = false;
            $("#"+categoryButtonName).css('background-color','#8267BE');
        }else if (categoryButtonName === 'network-code-button') {
                isForNN = 0;
                $("#"+categoryButtonName).css('background-color','#8267BE');
        } else{
            $("#"+categoryButtonName).css('background-color','');
        }

    }else {

        if (categoryButtonName === 'no-code-button'){
            noCode = true;
            $('#'+categoryButtonName).css('background-color','green');
            selectedCategories.push(categoryButtonName);
        }else if (categoryButtonName === 'network-code-button') {
            isForNN=1;
            $('#'+categoryButtonName).css('background-color','green');
            selectedCategories.push(categoryButtonName);
        }else{
            var element = document.getElementById(categoryButtonName);
            shortcutForAddingCategory(element);
        }
    }
}

hotkeys('alt+1, alt+2, alt+3, alt+4, alt+5, alt+6, alt+7, alt+8, alt+ctrl+1, alt+ctrl+2, alt+ctrl+3, alt+ctrl+4, alt+ctrl+5, alt+ctrl+6, alt+ctrl+7, alt+ctrl+8, alt+s, alt+c, alt+n', function (event, handler){
     // User defined categories start here
    var categoryButtonName;
    switch (handler.key) {

        case 'alt+1':
            selectDeselectViaShortcut('new-category-button');
            break;

        case 'alt+2':
            selectDeselectViaShortcut('code-summary-button');
            if(selectedCategories.includes('code-summary-button')){ selectDeselectViaShortcut('network-code-button'); }
            break;

        case 'alt+3':
            selectDeselectViaShortcut('expand-button');
            break;

        case 'alt+4':
            selectDeselectViaShortcut('rationale-button');
            break;

        case 'alt+5':
            selectDeselectViaShortcut('deprecation-button');
            break;

        case 'alt+6':
            selectDeselectViaShortcut('todo-button');
            break;

        case 'alt+7':
            selectDeselectViaShortcut('comment-code-button');
            break;

        case 'alt+8':
            selectDeselectViaShortcut('incomplete-button');
            break;

        case 'alt+ctrl+1':
            categoryButtonName = fetchUserDefinedCategoryButtonName(1);
            selectDeselectViaShortcut(categoryButtonName);
            break;

        case 'alt+ctrl+2':
            categoryButtonName = fetchUserDefinedCategoryButtonName(2);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+ctrl+3':
            categoryButtonName = fetchUserDefinedCategoryButtonName(3);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+ctrl+4':
            categoryButtonName = fetchUserDefinedCategoryButtonName(4);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+ctrl+5':
            categoryButtonName = fetchUserDefinedCategoryButtonName(5);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+ctrl+6':
            categoryButtonName = fetchUserDefinedCategoryButtonName(6);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+ctrl+7':
            categoryButtonName = fetchUserDefinedCategoryButtonName(7);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+ctrl+8':
            categoryButtonName = fetchUserDefinedCategoryButtonName(8);
            selectDeselectViaShortcut(categoryButtonName)
            break;

        case 'alt+c':
            selectDeselectViaShortcut('no-code-button');
            break;

        case 'alt+n':
            selectDeselectViaShortcut('network-code-button');
            break;

        // Submit shortcut
         case 'alt+s':
            submitClassification();
            break;
    }
});


function getCommentLength(comment){
    var realLen = 0;
    var items = comment.split('\n');
    for (var i=0; i<items.length; i++){
        if(items[i].trimLeft().trimRight() !== ''){
            //console.log('item['+i+']   ' +items[i]);
            realLen += 1;
        }
    }
    return realLen;
}

function retrieveMethodUnderClassification(charSpanComments){
    // we focus only on the first comment of the association is enough
    var firstComment = charSpanComments[0];
    var start = parseInt(firstComment.split('-')[0]);
    var end = parseInt(firstComment.split('-')[1]);


    for (var j=0; j<methodsRanges.length; j++){
        var method_start = parseInt(methodsRanges[j].split('-')[0]);
        var method_end = parseInt(methodsRanges[j].split('-')[1]);
        if (start > method_start && end < method_end ){
            // we found the target method ;)
            return j;
        }
    }
}

function howManyAssociations(){
    var sum = 0;
    for (const [key, value] of Object.entries(comment2Method)) {
        sum = sum + value;
    }
    return sum;
}

function check4Conflict(commentLabeler, commentReviewer, categoriesLabeler, categoriesReviewer, codeLabeler, codeReviewer){

    var refinedCommentLabeler = commentLabeler.join('\n');
    refinedCommentLabeler = refinedCommentLabeler.replace(/\n\r?/g, '');

    var refinedCommentReviewer = commentReviewer.join('\n');
    refinedCommentReviewer = refinedCommentReviewer.replace(/\n\r?/g, '');

    var refinedCodeLabeler = codeLabeler.join('\n');
    refinedCodeLabeler = refinedCodeLabeler.replace(/\n\r?/g, '');

    var refinedCodeReviewer = codeReviewer.join('\n');
    refinedCodeReviewer = refinedCodeReviewer.replace(/\n\r?/g, '');

    //By default we assume there are no conflicts
    var conflictsDicts = {'code':0, 'comment':0, 'categories':0};

    function _compareArrays(arr1,arr2){
          if(!(arr1 != null && arr2 != null && arr1.length == arr2.length)) {
            return false;
          }

          /* copy the arrays so that the original arrays are not affected when we set the indices to "undefined" */
          arr1 = [].concat(arr1);
          arr2 = [].concat(arr2);

          return arr1.every(function(element, index) {
            return arr2.some(function(e, i) {
              return e === element && (arr2[i] = undefined, true);
            });
          });
    }

    // Check conflict for comments
    if (refinedCommentLabeler !== refinedCommentReviewer && refinedCommentReviewer !== ''){
        //console.log('hit1');
        //return 1;
        conflictsDicts['comment']=1;
    }

    // Check conflict for code
    if (refinedCodeLabeler !== refinedCodeReviewer && refinedCommentReviewer !== ''){
        //console.log('hit2');
        //return 1;
        conflictsDicts['code']=1;
    }

    // Check conflict for categories
    if (categoriesReviewer.length > 0 ){
        //console.log('hit3');
        //return (_compareArrays(categoriesLabeler, categoriesReviewer) ? 0 : 1) //return 1 if they are the same, so we negate
        conflictsDicts['categories'] = (_compareArrays(categoriesLabeler, categoriesReviewer) ? 0 : 1);
    } else{
        //return 0;
        conflictsDicts['categories'] = 0;
    }

    return conflictsDicts;
}
