@echo off
echo Deleting existing function...
gcloud functions delete aiCoaching --region=us-central1 --project=gameplan-787a2 --quiet

echo Deploying function with public access...
gcloud functions deploy aiCoaching --runtime=nodejs18 --trigger=http --allow-unauthenticated --project=gameplan-787a2 --region=us-central1 --source=functions --entry-point=aiCoaching

echo Setting IAM policy for public access...
gcloud functions add-iam-policy-binding aiCoaching --region=us-central1 --project=gameplan-787a2 --member="allUsers" --role="roles/cloudfunctions.invoker"

echo Function deployed and configured for public access!