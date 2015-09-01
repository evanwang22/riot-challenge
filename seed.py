import requests
import sys
import time
from pymongo import MongoClient

NUM_MATCH_IDS = 1000

api_keys = []
api_file = open('.env')
for line in api_file:
  api_keys.append(line.strip('\n'))

item_list = [
"Abyssal Scepter",
"Archangel's Staff",
"Ardent Censer",
"Athene's Unholy Grail",
"Banner of Command",
"Banshee's Veil",
"Blade of the Ruined King",
"The Black Cleaver",
"The Bloodthirster",
"Dead Man's Plate",
"Essence Reaver",
"Face of the Mountain",
"Frost Queen's Claim",
"Frozen Heart",
"Frozen Mallet",
"Guardian Angel",
"Guinsoo's Rageblade",
"Hextech Gunblade",
"Iceborn Gauntlet",
"Infinity Edge",
"Last Whisper",
"Liandry's Torment",
"Lich Bane",
"Locket of the Iron Solari",
"Luden's Echo",
"Manamune",
"Maw of Malmortius",
"Mejai's Soulstealer",
"Mercurial Scimitar",
"Mikael's Crucible",
"Morellonomicon",
"Nashor's Tooth",
"Ohmwrecker",
"Phantom Dancer",
"Rabadon's Deathcap",
"Randuin's Omen",
"Ravenous Hydra (Melee Only)",
"Righteous Glory",
"Rod of Ages",
"Runaan's Hurricane (Ranged Only)",
"Rylai's Crystal Scepter",
"Sightstone",
"Spirit Visage",
"Statikk Shiv",
"Sterak's Gage",
"Sunfire Cape",
"Sword of the Occult",
"Talisman of Ascension",
"Thornmail",
"Titanic Hydra",
"Trinity Force",
"Twin Shadows",
"Void Staff",
"Warmog's Armor",
"Will of the Ancients",
"Wit's End",
"Youmuu's Ghostblade",
"Zeke's Harbinger",
"Zeke's Herald",
"Zephyr",
"Zhonya's Hourglass",
"Zz'Rot Portal",

"Boots of Swiftness",
"Mercury's Treads",
"Sorcerer's Shoes",
"Boots of Mobility",
"Berserker's Greaves",
"Ionian Boots of Lucidity",

"Perfect Hex Core",

"Enchantment: Warrior",
"Enchantment: Magus",
"Enchantment: Runeglaive",
"Enchantment: Juggernaut",
"Enchantment: Cinderhulk",
"Enchantment: Devourer"

]

def seed(match_ids):

    # get static champion data
    champions_URL = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion'
    champions_payload = {'api_key': api_keys[0], 'dataById': True, 'champData': 'tags'}
    champions_request = requests.get(champions_URL, champions_payload)
    champions_json = champions_request.json()['data']

    #get static item data
    items_URL = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/item'
    items_payload = {'api_key': api_keys[0], 'itemListData': 'stats'}
    items_request = requests.get(items_URL, items_payload)
    items_json = items_request.json()['data']

    # iterate over matches
    for index, match_id in enumerate(match_ids):

        print "INDEX IS: " + str(index)

        try:
            # get match data
            api_tries = 0

            while api_tries < 10:
                try:
                    time.sleep(0.01)
                    match_URL = 'https://na.api.pvp.net/api/lol/na/v2.2/match/' + match_id
                    match_payload = {'api_key': api_keys[index%1], 'includeTimeline': True}
                    match_request = requests.get(match_URL, match_payload)
                    match_json = match_request.json()
                    break
                except:
                    time.sleep(0.3)
                    print "API error:", sys.exc_info()[0]
                    print match_request

            # get list of participants
            match_participants = match_json['participants']

            # get teams
            match_teams = match_json['teams']

            # dictionary that maps participant ids to final data objects
            # data objects created for each participant to track:
            #  1. champion used
            #  2. major items purchased, in order of purchase
            #  3. whether or not they won
            data_object_map = {}
            for participant in match_participants:
                data_object = {}
                data_object['champion'] = champions_json[str(participant['championId'])]['name']
                data_object['items'] = []
                data_object['win'] = next((team['winner'] for team in match_teams if team['teamId'] == participant['teamId']))

                data_object_map[str(participant['participantId'])] = data_object

            # loop through timeline frames and
            # save lists of item related events
            item_events = []
            item_purchased_events = []
            item_sold_events = []
            item_undo_events = []
            for frame in match_json['timeline']['frames']:
                # loop through frame events
                if 'events' in frame:
                    for event in frame['events']:
                        # save relevant events
                        if 'itemId' in event:
                            # TODO handle ITEM_UNDO?
                            item_events.append(event)
                            if event['eventType'] == 'ITEM_PURCHASED':
                                item_purchased_events.append(event)
                            elif event['eventType'] == 'ITEM_SOLD':
                                item_sold_events.append(event)
                            elif event['eventType'] == 'ITEM_UNDO':
                                item_undo_events.append(event)

            for event in item_purchased_events:
                data_object = data_object_map[str(event['participantId'])]
                if str(event['itemId']) in items_json:
                    item_name = items_json[str(event['itemId'])]['name']
                    # TODO check for sightstone
                    if item_name in item_list and item_name not in data_object['items']:
                        data_object['items'].append(item_name);

            client = MongoClient()
            db = client['riot_challenge']
            match_data = db['514']

            for data_object in data_object_map.values():
                match_data.insert_one(data_object)

        except KeyError:
            print "Unexpected error:", sys.exc_info()[0]

if __name__ == '__main__':
    match_id_file = open(sys.argv[1])
    starting_index = int(sys.argv[2])

    match_ids = []
    match_id_file.readline()

    for i in range(starting_index):
      match_id_file.readline()

    for i in range(NUM_MATCH_IDS):
        line = match_id_file.readline()
        match_ids.append(line.split(',')[0])

    seed(match_ids)
