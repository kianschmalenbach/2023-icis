# Understanding Information-Limiting Environments in Personalized News  Platforms—A Systems Perspective

This repository contains the supplementary materials for our paper "Understanding Information-Limiting Environments in
Personalized News Platforms—A Systems Perspective," published at the Forty-Fourth International Conference on
Information Systems, Hyderabad, India 2023.

## Recommender Source Code

The source code of our news recommender is provided in the [recommender](recomender) directory. After downloading the
entire directory, you can simulate the interaction with the recommender on our actual news dataset. Note that the
provided version of the recommender does not update its database based on your interaction data.

To simulate interaction with the recommender, the following exemplary user profile, a randomly drawn user profile from
the participant database of our pre-study is used. The values for the attitude and opinion parameters can be seen in
the [user.js](recomender/src/user.js) file.

## Experiment Parameters

During our experiment, we used the following parameters for our recommender system:

```
feedLength = 3          // number of news items on one page
shiftFactor = 0.2       // shift factor gamma
userWeight = 15         // initial user weight w_init
mandatoryIterations = 4 // number of pages (equals 12 when multiplied with feedLength)
voluntaryIterations = 3 // number of optional additional pages
shortItemLength = 150   // number of characters shown per news item by default
longItemLength = 400    // number of characters shown per news item after clicking the 'read more' button
```

All further parameter values can also be seen in the [script.js](recomender/src/script.js) file of the recommender.

## News Items

Our study used 87 news items from nine ideologically diverse news outlets on the topic of universal basic income. The
news items can be found in a machine-readable JSON format in the file [news.json](news.json).
