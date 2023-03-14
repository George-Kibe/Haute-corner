## Procedure to deploy a Nodejs/expressjs server to AWS
> This Procedure uses elastic beanstalk service
Install EB CLI

### Initialize the eb 
eb init --platform node.js --region eu-west-1

create a folder in main app called .ebextensions
create a file nodecommand.config inside the folder
content
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"

## create environment
eb create --sample products

eb deploy

eb open



#### Serverless approach
npm i -g serverless
serverless config credentials --provider aws --key fhfh --secret gfgf
create project template

serverless create -t aws-nodejs
modify serverless.yaml file and handler.js files appropriately
import app in handler.js