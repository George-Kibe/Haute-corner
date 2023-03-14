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