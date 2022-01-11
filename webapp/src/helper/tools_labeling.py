import random

from sqlalchemy import func, distinct, select

from src import db
from src.database.models import LabelingData, Artifact, FlaggedArtifact
from src.helper.consts import N_API_NEEDS_LABELING
from src.helper.tools_common import who_is_signed_in, get_locked_artifacts, get_false_positive_artifacts


def get_labeling_status(username):  # OLD: get_user_labeling_status
    if username is None:
        return None

    labeling_status = {'username': username,
                       'total_n_artifact': get_total_number_of_classes_in_db(),
                       'total_n_labeled': get_n_labeled_artifact_per_user().get(username, 0),
                       'total_n_reviewed': get_n_reviewed_artifact_per_user().get(username, 0)
                       }

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
    return db.session.query(func.count(Artifact.id)).scalar()

def get_total_number_of_classes_to_be_labeled():
    total = db.session.query(func.count(Artifact.id)).scalar()
    labeled = get_total_number_of_labeled_classes()
    N_CLASSES_NEEDS_LABELING = total - labeled
    return N_CLASSES_NEEDS_LABELING

def get_total_number_of_labeled_classes():
    result = Artifact.query.filter_by(labeled=1).count()
    return result

def get_total_number_of_reviewed_classes():
    result = Artifact.query.filter_by(reviewed=1).count()
    return result

def get_total_number_of_labeled_and_reviewed_classes():
    result = Artifact.query.filter_by(labeled=1, reviewed=1).count()
    return result

def get_n_labeled_artifact_per_user():
    """
    Return a dictionary of {username: n_labeled_artifact, ...}
    """
    result = db.session.query(LabelingData.username_tagger, func.count(distinct(LabelingData.artifact_id))).group_by(LabelingData.username_tagger).all()
    ret = {}
    for row in result:
        ret[row[0]] = row[1]
    return ret

def get_n_reviewed_artifact_per_user():
    """
        Return a dictionary of {username: n_labeled_artifact, ...}
    """
    ret = {}
    result = db.session.query(LabelingData.username_tagger, func.count(Artifact.reviewed)).join(LabelingData, Artifact.id == LabelingData.artifact_id).filter(Artifact.reviewed==1).group_by(LabelingData.username_tagger).all()
    for row in result:
        ret[row[0]] = row[1]

    return ret


def choose_next_random_api():
    candidate_artifact_ids = {row[0] for row in db.session.query(Artifact.id).all()}

    # ############### 1. Remove Already Labeled By Me
    labeled_artifact_ids = {row[0] for row in
                            db.session.query(distinct(LabelingData.artifact_id)).filter(LabelingData.username_tagger == who_is_signed_in()).all()}
    candidate_artifact_ids -= labeled_artifact_ids


    # ############### 2. Remove Classes Locked at the moment
    locked_artifacts = get_locked_artifacts()
    locked_artifacts_by_2 = set(k for k, v in locked_artifacts.items() if v >= 1)
    print('Locked Classes: {}'.format(locked_artifacts_by_2))
    candidate_artifact_ids -= locked_artifacts_by_2

    # ############### 2. Remove Classes Locked at the moment
    completed_artifacts = {row[0] for row in
                           db.session.query(Artifact.id).join(LabelingData, Artifact.id == LabelingData.artifact_id).filter(Artifact.reviewed==1).all()}
    candidate_artifact_ids -= completed_artifacts

    candidate_artifact_ids_list = list(candidate_artifact_ids)

    # ############### 3. Remove APIs marked as broken
    broken_artifacts = {row[0] for row in
                            db.session.query(Artifact.id).filter(Artifact.isValid==0).all()}

    print('Broken artifacts: {}'.format(broken_artifacts))
    candidate_artifact_ids -= broken_artifacts

    print(candidate_artifact_ids)

    if len(candidate_artifact_ids) == 0:
        return -1

    return random.choice(candidate_artifact_ids_list)


