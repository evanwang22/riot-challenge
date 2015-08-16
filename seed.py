import requests
import simplejson as json

api_key = 'bf0afb8e-278d-4c49-8c32-9a26f28f0a66'

def seed(match_ids):

    # get static champion data
    champions_URL = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion'
    champions_payload = {'api_key': api_key, 'dataById': True, 'champData': 'tags'}
    champions_request = requests.get(champions_URL, champions_payload)
    champions_json = champions_request.json()['data']

    # get list of mage ids
    # TODO this doesn't capture all the champs we want, consider just using all champs
    # TODO not sure we even need this in backend; can just create a list front end for filtering there
    mage_ids = [];
    for champion_id in champions_json:
        champion_data = champions_json[champion_id]
        if 'Mage' in champion_data['tags']:
            mage_ids.append(champion_id)

    #get static item data
    items_URL = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/item'
    items_payload = {'api_key': api_key, 'itemListData': 'stats'}
    items_request = requests.get(items_URL, items_payload)
    items_json = items_request.json()['data']

    # get list of ap item ids
    # TODO likewise, can probably just keep all item data and filter on front end
    ap_item_ids = {};
    for item_id in items_json:
        item_data = items_json[item_id]
        item_stats = item_data['stats']
        if 'FlatMagicDamageMod' in item_stats and item_stats['FlatMagicDamageMod']  >= 40:
            ap_item_ids[item_id] = item_data

    print ap_item_ids
    # iterate over matches
    for match_id in match_ids:
        # get match data
        match_URL = 'https://na.api.pvp.net/api/lol/na/v2.2/match/' + match_id
        match_payload = {'api_key': api_key, 'includeTimeline': True}
        match_request = requests.get(match_URL, match_payload)
        match_json = match_request.json()

        # get list of participants
        match_participants = match_json['participants']

        # dictionary that maps participant ids to final data objects
        # data objects created for each participant to track:
        #  1. champion used
        #  2. major items purchased, in order of purchase
        #  3. whether or not they won
        data_objects_map = {}
        for participant in match_participants:
            data_object = {}
            data_object['champion'] = champions_json[participant['championId']]
            data_object['items'] = []

            data_objects_map[participant['participantId']] = data_object



        # get list of participants playing mages
        # TODO keep all participants?
        mage_participants = []
        for participant in match_participants:
            if participant['championId'] in mage_ids:
                mage_participants.append(participant)

        # loop through timeline frames and
        # save lists of item related events
        item_purchased_events = []
        item_sold_events = []
        item_undo_events = []
        for frame in match_json['timeline']['frames']:
            # loop through frame events
            if 'events' in frame:
                for event in frame['events']:
                    # save relevant events
                    if event['type'] == 'ITEM_PURCHASED':
                        item_purchased_events.append(event)
                    elif event['type'] == 'ITEM_SOLD':
                        item_sold_events.append(event)
                    elif event['type'] == 'ITEM_UNDO':
                        item_undo_events.append(event)




if __name__ == '__main__':
    seed(['1852548676'])
