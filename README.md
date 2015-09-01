# AP Item Build Trends

http://buildtrends.cfapps.io/

## Project setup

### Installation

Our tech stack relies on three main technologies: [Python 2](https://www.python.org/), [Node.js](https://nodejs.org/), and [MongoDB](https://www.mongodb.org/).

All three of these technologies are fairly mainstream and are available through package managers such as Homebrew on OSX and `apt` or `yum` on Linux distributions. Windows installers can be found easily through the above links.

We used a few peripheral technologies which aren't critical to running the project but are very helpful: [pip](https://pip.pypa.io/en/stable/#) (python package manager), [sass](http://sass-lang.com/) (because CSS could use an upgrade) and [nodemon](http://nodemon.io/) (automatically restart Node.js server when code changes). 

## Tech stack and development

### Data retrieval

We used Python in order to retrieve data from the riot matchData API. Python is well-suited to scripting and data processing tasks, especially one such as ours in which speed wasn't an important requirement. We collect data from the riot API, process it, and write it to MongoDB in our script.

To run the script from the root directory of this repository:

```
python seed.py AP_ITEM_CHALLENGE/<any file in this directory> <startIndex>
```

Note that the script will expect mongoDB to be running locally and for there to be a `.env` file in your root directory containing your Riot API key.  

### Backend

We used [Express](http://expressjs.com/), a minimalistic Node.js web framework, for our backend. It's relatively simple as our backend consists of just 3 routes, two of which simply serve JSON in response to get requests. We chose MongoDB to use in conjunction with Express not only because the two are often used together, but also because our data is read-only and we didn't have a set schema in mind for how we wanted to store our data because the backend functionality was relatively simple.

To run the application from the root of this repository:

```
cd app
npm install
npm start
```
If Nodemon isn't installed on your machine, run `node ./bin/www` instead of the last command.

### Frontend

With the exception of jQuery and some small components such as [Selectize](http://brianreavis.github.io/selectize.js/), our entire frontend was built from scratch. Ultimately, it may have been beneficial to use a framework however, as we ended up building our graph so it re-renders whenever the frontend fetches new data (similar to the AngularJS $digest loop). However, we're happy with the behavior we ended up with on the frontend. It would be tricky to extend the functionality of the frontend, however, as the code is dense and has a lot of data processing logic.

To see the site, go to `localhost:3000`.

## Analysis

We ended up drawing on 20,000 matches worth of NA data (nearly 200,000 individual games played) in total for our analysis. Overall, we found a few large changes in item purchasing trends between 5.11 and 5.14, with the most notable change being the increase in purchases of Enchantment: Runeglaive. In both patches 5.11 and 5.14 over 24,000 champions built an AP item for their first major purchase. With that large of a sample size, we have statistically significant findings; enough for a confidence interval of 0.8 and a confidence level of 99%. Despite the huge swing towards Runeglaive, based on our data those who built it first still fell just short of winning a majority of games played, recording a 49.95% win percentage.








