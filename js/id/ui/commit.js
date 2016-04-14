iD.ui.Commit = function(context) {
    var event = d3.dispatch('cancel', 'save');

    function commit(selection) {
        var changes = context.history().changes(),
            summary = context.history().difference().summary();

        function zoomToEntity(change) {

            var entity = change.entity;
            if (change.changeType !== 'deleted' &&
                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                context.map().zoomTo(entity);
                context.surface().selectAll(
                    iD.util.entityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }

        var header = selection.append('div')
            .attr('class', 'header fillL');

        header.append('button')
            .attr('class', 'fr')
            .on('click', event.cancel)
            .append('span')
            .attr('class', 'icon close');

        header.append('h3')
            .text(t('commit.title'));

        var body = selection.append('div')
            .attr('class', 'body');

        // Comment Section
        //Commented out for Hootenanny
/*
        var commentSection = body.append('div')
            .attr('class', 'modal-section form-field commit-form');

        commentSection.append('label')
            .attr('class', 'form-label')
            .text(t('commit.message_label'));

        var commentField = commentSection.append('textarea')
            .attr('placeholder', t('commit.description_placeholder'))
            .attr('maxlength', 255)
            .property('value', context.storage('comment') || '')
            .on('input.save', function() {
                d3.selectAll('.save-section .save-button')
                    .attr('disabled', (this.value.length ? null : true));
            })
            .on('blur.save', function() {
                context.storage('comment', this.value);
            });

        function enableDisableSaveButton() {
            d3.selectAll('.save-section .save-button')
                .attr('disabled', (this.value.length ? null : true));
        }

        commentField.node().select();
*/

        // Warnings
        var warnings = body.selectAll('div.warning-section')
            .data([context.history().validate(changes)]) //iD v1.7.5
            .enter()
            .append('div')
            .attr('class', 'modal-section warning-section fillL2')
            .style('display', function(d) { return _.isEmpty(d) ? 'none' : null; })
            .style('background', '#ffb');

        warnings.append('h3')
            .text(t('commit.warnings'));

        var warningLi = warnings.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(function(d) { return d; })
            .enter()
            .append('li')
            .style()
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', warningClick);

        warningLi
            .call(iD.svg.Icon('#icon-alert', 'pre-text'));

        warningLi.append('strong').text(function(d) {
            return d.message;
        });

        warningLi.filter(function(d) { return d.tooltip; })
            .call(bootstrap.tooltip()
                .title(function(d) { return d.tooltip; })
                .placement('top')
            );

        // Save Section
        var saveSection = body.append('div')
            .attr('class','modal-section save-section fillL cf');

/*
        var prose = saveSection.append('p')
            .attr('class', 'commit-info')
            .html(t('commit.upload_explanation'));

        context.connection().userDetails(function(err, user) {
            if (err) return;

            var userLink = d3.select(document.createElement('div'));

            if (user.image_url) {
                userLink.append('img')
                    .attr('src', user.image_url)
                    .attr('class', 'icon pre-text user-icon');
            }

            userLink.append('a')
                .attr('class','user-info')
                .text(user.display_name)
                .attr('href', context.connection().userURL(user.display_name))
                .attr('tabindex', -1)
                .attr('target', '_blank');

            prose.html(t('commit.upload_explanation_with_user', {user: userLink.html()}));
        });
*/


        // Buttons
        var buttonSection = saveSection.append('div')
            .attr('class','buttons fillL cf');

        //Using summary to determine if button should be enabled
        var saveButton = buttonSection.append('button')
            .attr('class', 'action col5 button save-button')
            .property('disabled', function() {
                return summary === undefined? true : _.isEmpty(summary);
            })
            .on('click.save', function() {
                event.save({
                    comment: ''
                });
            });

        saveButton.append('span')
            .attr('class', 'label')
            .text(t('commit.save'));

        //iD v1.7.5
        var cancelButton = buttonSection.append('button')
            .attr('class', 'action col5 button cancel-button')
            .on('click.cancel', function() { event.cancel(); });

        cancelButton.append('span')
            .attr('class', 'label')
            .text(t('commit.cancel'));


        // Changes
        var changeSection = body.selectAll('div.commit-section')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        changeSection.append('h3')
            .text(t('commit.changes', {count: summary.length}));

        var li = changeSection.append('ul')
            .attr('class', 'changeset-list')
            .selectAll('li')
            .data(summary)
            .enter()
            .append('li')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', zoomToEntity);

        //changed for iD v1.9.2
        li.each(function(d) {
            d3.select(this)
                .call(iD.svg.Icon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
        });
        /*li.append('span')
            .attr('class', function(d) {
                return d.entity.geometry(d.graph) + ' ' + d.changeType + ' icon icon-pre-text';
            });*/

        li.append('span')
            .attr('class', 'change-type')
            .text(function(d) {
                return t('commit.' + d.changeType) + ' ';
            });

        li.append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                return context.presets().match(d.entity, d.graph).name();
            });

        li.append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                var name = iD.util.displayName(d.entity) || '',
                    string = '';
                if (name !== '') string += ':';
                return string += ' ' + name;
            });

        li.style('opacity', 0)
            .transition()
            .style('opacity', 1);

        li.style('opacity', 0)
            .transition()
            .style('opacity', 1);

        function mouseover(d) {
            if (d.entity) {
                context.surface().selectAll(
                    iD.util.entityOrMemberSelector([d.entity.id], context.graph())
                ).classed('hover', true);
            }
        }

        function mouseout() {
            context.surface().selectAll('.hover')
                .classed('hover', false);
        }

        function warningClick(d) {
            if (d.entity) {
                context.map().zoomTo(d.entity);
                context.enter(
                    iD.modes.Select(context, [d.entity.id])
                        .suppressMenu(true));
            }
        }
    }

    return d3.rebind(commit, event, 'on');
};
