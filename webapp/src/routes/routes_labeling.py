import datetime
import sys

from flask import render_template, request, redirect, url_for, jsonify
from src.database.models import LabelingData, Artifact, FlaggedArtifact, UserDefinedCategory
from src.helper.tools_labeling import *
from src.helper.tools_common import is_signed_in, lock_artifact_by
from src import app
from src.helper.consts import *
import json, re
from dict_hash import dict_hash
import time


@app.route("/labeling", methods=['GET', 'POST'])
def labeling():
    if request.method != 'POST':
        if is_signed_in():
            # This is not fully correct! because maybe tagger A label N needed artifacts,
            # but since #tagged_by_two is less than two, app still propose artifacts to guy A
            n_classes = get_total_number_of_classes_in_db()
            n_classes_reviewed = get_total_number_of_reviewed_classes()
            if n_classes_reviewed == n_classes:
                return "We are done. All {} Classes are tagged and eventual conflicts have been resolved".format(
                    n_classes)
            else:
                selected_artifact_id = choose_next_random_api()
                #print('Random selected artifact: {}'.format(selected_artifact_id))
                if selected_artifact_id < 0:
                    return "It seems you are done. Please Wait for others [Code: {}]".format(selected_artifact_id)
                return redirect(url_for('labeling_with_artifact', target_artifact_id=selected_artifact_id))
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"


@app.route("/labeling/<target_artifact_id>", methods=['GET', 'POST'])
def labeling_with_artifact(target_artifact_id):
    if not IS_SYSTEM_UP:
        return SYSTEM_STATUS_MESSAGE

    if request.method != 'POST':
        if is_signed_in():

            target_artifact_id = int(target_artifact_id)
            artifact_data = Artifact.query.filter_by(id=target_artifact_id).first()
            all_taggers = {row[0] for row in
                           LabelingData.query.with_entities(LabelingData.username_tagger).filter_by(
                               artifact_id=target_artifact_id).all()}

            udc = UserDefinedCategory.query.all()
            listNameCategory = []
            listDescriptionCategory = []
            listID = []
            listCategoryButton = []
            listShortcuts = []

            for row in udc:
                listNameCategory.append(row.categoryName)
                listDescriptionCategory.append(row.description)
                listID.append(row.category_id)
                listCategoryButton.append(row.categoryButtonName)
                listShortcuts.append(row.shortcut)

            udc_item = {'category_id': listID,
                        'category_name': listNameCategory,
                        'description': listDescriptionCategory,
                        'category_button_name': listCategoryButton,
                        'shortcut': listShortcuts
                        }

            lock_artifact_by(who_is_signed_in(), target_artifact_id)

            spanListMethods = eval(artifact_data.methodsListLines)
            methodsName = eval(artifact_data.methodsName)
            numberOfCommentsPerMethod = eval(artifact_data.methodsComments)

            #this one works only on bar
            if sys.platform=='linux':
                newLinkToFileJava = '/labeling-machine/data/' + '/'.join(artifact_data.linkToFileJava.split('/')[4:])
            else:
                #Locally on antonio's machine
                newLinkToFileJava = '/Users/antonio/Desktop/' +'/'.join(artifact_data.linkToFileJava.split('/')[3:])

            with open(newLinkToFileJava) as f:
                javaClassText = f.read()

            # Adding character ranges for each method
            methodsRanges = []
            for mLine in spanListMethods:

                start = int(mLine.split('-')[0])
                end = int(mLine.split('-')[1])

                with open(newLinkToFileJava, encoding='utf-8') as f:

                    cumLines = ''
                    fromBeginning = ''
                    flagBeginning = False

                    for (index, line) in enumerate(f):
                        if (index == start - 1):
                            cumLines += line
                            flagBeginning = True

                        elif (index == end - 1):
                            cumLines += line
                            break

                        elif not flagBeginning:
                            fromBeginning += line

                        else:
                            cumLines += line

                beginningToEnd = fromBeginning + cumLines

                offset_start = len(fromBeginning.encode('utf-8')) + 4
                offset_end = len(beginningToEnd.encode('utf-8'))

                methodsRanges.append( '{}-{}'.format(offset_start, offset_end))


            counterAssociations = artifact_data.counterAssociations

            isLabeled = 1 if artifact_data.labeled == 1 else 0
            isReviewed = 1 if artifact_data.reviewed == 1 else 0

            commentPositionList = []
            #rangeHighlightedCodeRev = []
            moveSelectionButtonList = []
            selectedCategories = []
            selectedCode = []
            selectedComments = []
            codeSpan = []
            commentSpan = []

            if (isLabeled == 1):
                artifact_label = LabelingData.query.filter_by(artifact_id=target_artifact_id).first()
                commentPositionList = eval(artifact_label.commentPosition)
                moveSelectionButtonList = eval(artifact_label.moveSelectionButton)
                selectedCategories = eval(artifact_label.categories)
                selectedCode = eval(artifact_label.code)
                selectedComments = eval(artifact_label.comments)
                codeSpan = eval(artifact_label.codeSpan)
                commentSpan = eval(artifact_label.commentSpan)


            linesList = []
            linesMethodsString = ''



            for (line_index, line) in enumerate(javaClassText.splitlines()):
                linesList.append(line_index)
                linesMethodsString += '{}\n'.format(line_index)

            return render_template('labeling_pages/artifact.html',
                                   artifact_id = target_artifact_id,
                                   artifact_data = artifact_data,
                                   artifact_class = javaClassText,
                                   artifact_UDC = udc_item,
                                   artifact_methodsRanges = methodsRanges,
                                   artifact_methodsListLines = spanListMethods,
                                   artifact_commentsPerMethod = numberOfCommentsPerMethod,
                                   artifact_label_commentPositionList = commentPositionList,
                                   artifact_moveSelectionButtonList = moveSelectionButtonList,
                                   isLabeled = isLabeled,
                                   isReviewed = isReviewed,
                                   artifact_methodsName = methodsName,
                                   artifact_lines = linesList,
                                   counterAssociations = counterAssociations,
                                   overall_labeling_status = get_overall_labeling_progress(),
                                   user_info = get_labeling_status(who_is_signed_in()),
                                   artifact_linesString = linesMethodsString,
                                   artificat_label_categories = selectedCategories,
                                   selectedCode = selectedCode,
                                   selectedComments = selectedComments,
                                   codeSpan = codeSpan,
                                   commentSpan = commentSpan,
                                   all_taggers = ', '.join(all_taggers) if all_taggers is not None else None
                                   )
        else:
            return "Please Sign-in first."
    else:
        return "Why POST?"


@app.route("/markBrokenClass", methods=['GET', 'POST'])
def markBrokenClass():

    if request.method == 'POST':
        if request.form['artifact_id'] == '':
            return jsonify('{ "status": "Empty arguments" }')

    try:
        artifact = Artifact.query.filter_by(id=int(request.form['artifact_id'])).first()
        artifact.isValid = 0
        db.session.commit()
    except Exception:
        print('Already Added, we do not care')

    return jsonify('{ "status": "success" }')

@app.route("/flag", methods=['GET', 'POST'])
def flagClass():

    if request.method == 'POST':
        if request.form['artifact_id'] == '':
            return jsonify('{ "status": "Empty arguments" }')

    try:
        new_fp_report = FlaggedArtifact(artifact_id=int(request.form['artifact_id']), added_by=who_is_signed_in())
        db.session.add(new_fp_report)
        db.session.commit()
    except Exception:
        print('Already Added, we do not care')

    return jsonify('{ "status": "success" }')

@app.route("/label", methods=['GET', 'POST'])
def label():

    if request.method == 'POST':
        if request.form['artifact_id'] == '' or request.form['duration'] == '':
            return jsonify('{ "status": "Empty arguments" }')

        artifact_id = int(request.form['artifact_id'])
        duration_sec = int(request.form['duration'])
        code = request.form['code']
        comments = request.form['comments']
        categories = request.form['categories']
        codeSpan = request.form['codeSpan']
        commentSpan = request.form['commentSpan']
        workingMode = request.form['workingMode']
        commentPosition = request.form['commentPosition']
        moveSelectionButton = request.form['moveToSelectedButtons']
        counterAssociations = request.form['counterAssociations']
        userDefinedNewCategoryDescriptions = eval(request.form['userDefinedNewCategoryDescriptions'])
        userDefinedNewCategoryNames = eval(request.form['userDefinedNewCategoryNames'])
        userDefinedNewCategoryShortcuts = eval(request.form['categoryShortcuts'])


        if int(workingMode) == 0:
            isLabeled = 1
            isReviewed = 0
        else:
            isLabeled = 1
            isReviewed = 1


        if(int(workingMode)==0):
            jr = LabelingData(artifact_id=artifact_id, username_tagger=who_is_signed_in(),
                                  elapsed_labeling_time=duration_sec, code=code, comments=comments, codeSpan=codeSpan,
                                  commentSpan=commentSpan, categories=categories, commentPosition=commentPosition,
                                  moveSelectionButton=moveSelectionButton, labeled_at=datetime.datetime.utcnow()
                              )

            db.session.add(jr)
            db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
            db.session.commit()

        else:
            labeling_data = LabelingData.query.filter_by(artifact_id=artifact_id).first()

            #Set isChanged flag to keep track of instances that have been changed by the reviewer
            if ( dict_hash(eval(comments)) != dict_hash(eval(labeling_data.comments))     or
                 dict_hash(eval(categories)) != dict_hash(eval(labeling_data.categories)) or
                 dict_hash(eval(code)) != dict_hash(eval(labeling_data.code))):
                labeling_data.isChanged = 1
            else:
                labeling_data.isChanged = 0

            labeling_data.comments = comments
            labeling_data.reviewed_at = datetime.datetime.utcnow()
            labeling_data.elapsed_reviewing_time = duration_sec
            labeling_data.username_reviewer = who_is_signed_in()
            labeling_data.commentPosition = commentPosition
            labeling_data.moveSelectionButton = moveSelectionButton
            labeling_data.code = code
            labeling_data.reviewed_at = datetime.datetime.utcnow()
            labeling_data.codeSpan = codeSpan
            labeling_data.commentSpan = commentSpan
            labeling_data.categories = categories
            db.session.commit()

        artifact = Artifact.query.filter_by(id=artifact_id).first()
        artifact.labeled = isLabeled
        artifact.reviewed = isReviewed
        artifact.counterAssociations = counterAssociations
        db.session.commit()

        if(len(userDefinedNewCategoryDescriptions)>0):

            for (name, description, shortcut) in zip(userDefinedNewCategoryNames, userDefinedNewCategoryDescriptions, userDefinedNewCategoryShortcuts):
                buttonID = (''.join(name.split(' ')) + '-button').lower()
                udc = UserDefinedCategory(categoryName=name, description=description, categoryButtonName = buttonID, shortcut=shortcut, user=who_is_signed_in())
                db.session.add(udc)
                db.session.flush()  # if you want to fetch autoincreament column of inserted row. See: https://stackoverflow.com/questions/1316952
                db.session.commit()


        return jsonify('{ "status": "success" }')

