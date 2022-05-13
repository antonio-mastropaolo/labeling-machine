import random

from sqlalchemy import func, distinct, select

from src import db
from src.database.models import LabelingDataLabeler, LabelingDataReviewer, Artifact, FlaggedArtifact, Conflict, LabelingDataNoConflicts
from src.helper.consts import N_API_NEEDS_LABELING
from src.helper.tools_common import who_is_signed_in, get_locked_artifacts

def get_labeling_status(username):  # OLD: get_user_labeling_status
    if username is None:
        return None
    labeling_status = {'username': username,
                       'total_n_artifact': get_total_number_of_classes_in_db(),
                       'total_n_labeled': get_n_labeled_artifact_per_user().get(username,0),
                       'total_n_reviewed': get_n_reviewed_artifact_per_user().get(username,0)
                       }
    #print(labeling_status)
    return labeling_status


def get_overall_labeling_progress():

    labeling_status = {'source_id': 0,
                       #'source_name': "Artifact Set",
                       'n_artifacts_labeled': get_total_number_of_labeled_classes(),
                       'n_artifacts_to_be_labeled': get_total_number_of_classes_to_be_labeled(),
                       'n_artifacts_reviewed': get_total_number_of_reviewed_classes(),
                       'n_artifacts_labeled_and_reviewed': get_total_number_of_labeled_and_reviewed_classes(),
                       'n_total_artifacts': get_total_number_of_classes_in_db()
                       }

    return labeling_status


def get_total_number_of_classes_in_db():
    all_classes = db.session.query(func.count(Artifact.id)).filter(Artifact.isValid == 1).scalar()
    return all_classes
    #return 10 for test

def get_total_number_of_classes_to_be_labeled():
    total = db.session.query(func.count(Artifact.id)).scalar()
    #total = 10 for test
    labeled = get_total_number_of_labeled_classes()
    N_CLASSES_NEEDS_LABELING = total - labeled
    return N_CLASSES_NEEDS_LABELING

def get_total_number_of_labeled_classes():
    result = LabelingDataLabeler.query.count()
    return result

def get_total_number_of_reviewed_classes():
    result = LabelingDataReviewer.query.count()
    #return 10 for test
    return result

def get_total_number_of_labeled_and_reviewed_classes():
    result =  db.session.query(LabelingDataLabeler.artifact_id).join(LabelingDataReviewer, LabelingDataLabeler.artifact_id == LabelingDataReviewer.artifact_id).count()
    return result

def get_n_labeled_artifact_per_user():
    """
    Return a dictionary of {username: n_labeled_artifact, ...}
    """
    result = db.session.query(LabelingDataLabeler.username, func.count(distinct(LabelingDataLabeler.artifact_id))).group_by(LabelingDataLabeler.username).all()
    ret = {}
    for row in result:
        ret[row[0]] = row[1]

    return ret

def get_n_reviewed_artifact_per_user():
    """
        Return a dictionary of {username: n_labeled_artifact, ...}
    """
    ret = {}
    #result = db.session.query(LabelingData.username_reviewer, func.count(Artifact.reviewed)).join(LabelingData, Artifact.id == LabelingData.artifact_id).filter(Artifact.reviewed==1).group_by(LabelingData.username_tagger).all()
    result = db.session.query(LabelingDataReviewer.username, func.count(distinct(LabelingDataReviewer.artifact_id))).group_by(LabelingDataReviewer.username).all()
    for row in result:
        ret[row[0]] = row[1]
    print(result)
    return ret

def choose_next_instance_to_be_solved():

    solved_artefacts = {row[0] for row in db.session.query(LabelingDataNoConflicts.artifact_id).all()}
    #print("Solved artifact: ",solved_artefacts)

    #Instances needing resolution
    instances = {row[0] for row in db.session.query(Conflict.artifact_id).all()}
    instances -= solved_artefacts

    #The user x cannot resolve conflicts he has previously labeled
    labeled_artifact_ids = {row[0] for row in db.session.query(distinct(LabelingDataLabeler.artifact_id)).filter(LabelingDataLabeler.username == who_is_signed_in()).all()}
    instances -= labeled_artifact_ids

    # The user x cannot resolve conflicts he has previously reviewed
    reviewed_artifact_ids = {row[0] for row in db.session.query(distinct(LabelingDataReviewer.artifact_id)).filter(LabelingDataReviewer.username == who_is_signed_in()).all()}
    instances -= reviewed_artifact_ids


    candidate_artifact_ids = list(instances)

    #print("Candidate list: ", candidate_artifact_ids)

    if len(candidate_artifact_ids) == 0:
        return None,None

    result = []

    while True:

        picked_artifact = random.choice(candidate_artifact_ids)

        canBreak = False
        for q in db.session.query(Conflict).filter(Conflict.artifact_id == picked_artifact).all():

            newObject = {'classification':q.__dict__['classification'],
                         'conflict_categories':q.__dict__['conflict_categories'],
                         'conflict_code':q.__dict__['conflict_code'],
                         'conflict_comment': q.__dict__['conflict_comment']
                         }

            #print("Classification: {}".format(q.__dict__['classification']))
            #print("\t Conflict categories: {}".format(q.__dict__['conflict_categories']))
            #print("\t Conflict code: {}".format(q.__dict__['conflict_code']))
            #print("\t Conflict comment: {}".format(q.__dict__['conflict_comment']))
            if q.__dict__['conflict_categories'] == 0 and q.__dict__['conflict_code'] == 0 and q.__dict__['conflict_comment']==1:
                canBreak = True
                result.append(newObject)

        if canBreak:
            break


    return picked_artifact, result



def choose_next_random_api():


    candidate_artifact_ids = {row[0] for row in db.session.query(Artifact.id).all()}

    # ############### 1. Remove Already Labeled And Reviewed By Me
    labeled_artifact_ids = {row[0] for row in db.session.query(distinct(LabelingDataLabeler.artifact_id)).filter(LabelingDataLabeler.username == who_is_signed_in()).all()}
    candidate_artifact_ids -= labeled_artifact_ids

    reviewed_artifact_ids = {row[0] for row in db.session.query(distinct(LabelingDataReviewer.artifact_id)).filter(LabelingDataReviewer.username == who_is_signed_in()).all()}
    candidate_artifact_ids -= reviewed_artifact_ids
    # print(list(sorted(labeled_artifact_ids)))
    # print(len(labeled_artifact_ids))

    # ############### 2. Remove Classes Locked at the moment
    locked_artifacts = get_locked_artifacts()
    locked = set(k for k, v in locked_artifacts.items())
    candidate_artifact_ids -= locked

    # ############### 2. Remove fully classified Classes
    completed_artifacts = {row[0] for row in db.session.query(LabelingDataLabeler.artifact_id).join(LabelingDataReviewer, LabelingDataLabeler.artifact_id == LabelingDataReviewer.artifact_id).all()}
    candidate_artifact_ids -= completed_artifacts
    #print(len(completed_artifacts))

    # ############### 3. Remove Classes marked as broken
    broken_artifacts = {row[0] for row in db.session.query(Artifact.id).filter(Artifact.isValid==0).all()}
    candidate_artifact_ids -= broken_artifacts
    #print(broken_artifacts)
    candidate_artifact_ids_list = list(candidate_artifact_ids)

    #print(sorted(candidate_artifact_ids_list))
    #print(sorted(list(broken_artifacts)))

    # Instances to be reviewed that should be prioritized
    to_be_reviewed = {row[0] for row in db.session.query(Artifact.id).filter(Artifact.labeled == 1, Artifact.reviewed == 0).all()}
    to_be_reviewed -= labeled_artifact_ids
    to_be_reviewed -= reviewed_artifact_ids
    to_be_reviewed -= locked
    to_be_reviewed -= completed_artifacts
    to_be_reviewed -= broken_artifacts

    candidate_artifact_for_reviewing = list(to_be_reviewed)
    #print(candidate_artifact_for_reviewing)

    #return random.choice(candidate_artifact_ids_list)
    if len(candidate_artifact_ids) == 0:
        return -1

    else:
        if len(candidate_artifact_for_reviewing)>0:
            return random.choice(candidate_artifact_for_reviewing)
        else:
            return random.choice(candidate_artifact_ids_list)


