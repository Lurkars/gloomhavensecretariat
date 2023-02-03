export const sortMonsterStandees = function (standees) {
    return standees.sort((a, b) => {
        if (a.name < b.name) {
            return -1
        } else if (a.name > b.name) {
            return 1;
        }

        if (a.type && !b.type) {
            return -1;
        } else if (!a.type && b.type) {
            return 1;
        } else if (a.type != b.type) {
            return a.type == 'normal' ? -1 : 1;
        }

        if (a.player2 && !b.player2) {
            return -1;
        } else if (!a.player2 && b.player2) {
            return 1;
        } else if (a.player2 != b.player2) {
            return a.player2 == 'normal' ? -1 : 1;
        }

        if (a.player3 && !b.player3) {
            return -1;
        } else if (!a.player3 && b.player3) {
            return 1;
        } else if (a.player3 != b.player3) {
            return a.player3 == 'normal' ? -1 : 1;
        }

        if (a.player4 && !b.player4) {
            return -1;
        } else if (!a.player4 && b.player4) {
            return 1;
        } else if (a.player4 != b.player4) {
            return a.player4 == 'normal' ? -1 : 1;
        }
    })
}