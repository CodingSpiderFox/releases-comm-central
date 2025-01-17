from __future__ import absolute_import, print_function, unicode_literals

import os
from taskgraph.util.treeherder import split_symbol, join_symbol, add_suffix
from taskgraph.util.yaml import load_yaml
from taskgraph.util.python_path import find_object


def _get_aliases(kind, job):
    aliases = {job['name']}

    if kind == 'toolchain':
        if job['run'].get('toolchain-alias'):
            aliases.add(job['run'].get('toolchain-alias'))

    return aliases


def _get_loader(path, config):
    try:
        loader = config['loader']
    except KeyError:
        raise KeyError("{!r} does not define `loader`".format(path))
    return find_object(loader)


def _remove_suffix(text, suffix):
    """
    Removes a suffix from a string.
    """
    if text.endswith(suffix):
        _drop = len(suffix) * -1
        text = text[:_drop]
    return text


def reference_loader(kind, path, config, params, loaded_tasks):
    """
    Loads selected jobs from a different taskgraph hierarchy.

    This loads jobs of the given kind from the taskgraph rooted at `base-path`,
    and includes all the jobs with names or aliaes matching the names in the
    `jobs` key.
    """
    base_path = config.pop('base-path')
    sub_path = os.path.join(base_path, kind)
    sub_config = load_yaml(sub_path, "kind.yml")
    loader = _get_loader(sub_path, sub_config)
    inputs = loader(kind, sub_path, sub_config, params, loaded_tasks)

    jobs = config.pop('jobs', None)

    config.update(sub_config)

    if jobs is not None:
        jobs = set(jobs)
        return (job for job in inputs if (_get_aliases(kind, job) & jobs))
    else:
        return inputs


def remove_widevine(config, jobs):
    """
    Remove references to widevine signing.

    This is to avoid adding special cases for handling signed artifacts
    in mozilla-central code. Artifact signature formats are determined in
    taskgraph.util.signed_artifacts. There's no override mechanism so we
    remove the autograph_widevine format here.
    """
    for job in jobs:
        task = job['task']
        payload = task['payload']

        widevine_scope = 'project:comm:thunderbird:releng:signing:format' \
                         ':autograph_widevine'
        if widevine_scope in task['scopes']:
            task['scopes'].remove(widevine_scope)
        if 'upstreamArtifacts' in payload:
            for artifact in payload['upstreamArtifacts']:
                if 'autograph_widevine' in artifact.get('formats', []):
                    artifact['formats'].remove('autograph_widevine')

        yield job


def tests_drop_1proc(config, jobs):
    """
    Remove the -1proc suffix from Treeherder group symbols.
    Restore the -e10s suffix (because some day we will have them!)

    Reverses the effects of bug 1541527. Thunderbird builds are all single
    process.
    """
    for job in jobs:
        test = job['run']['test']
        e10s = test['e10s']

        if not e10s:  # test-name & friends end with '-1proc'
            test['test-name'] = _remove_suffix(test['test-name'], '-1proc')
            test['try-name'] = _remove_suffix(test['try-name'], '-1proc')
            group, symbol = split_symbol(test['treeherder-symbol'])
            if group != '?':
                group = _remove_suffix(group, '-1proc')
            test['treeherder-symbol'] = join_symbol(group, symbol)

            job['label'] = job['label'].replace('-1proc', '')
            job['name'] = _remove_suffix(job['name'], '-1proc')
            job['treeherder']['symbol'] = test['treeherder-symbol']
        else:  # e10s in the future
            test['test-name'] = add_suffix(test['test-name'], '-e10s')
            test['try-name'] = add_suffix(test['try-name'], '-e10s')
            group, symbol = split_symbol(test['treeherder-symbol'])
            if group != '?':
                group = add_suffix(group, '-e10s')
            test['treeherder-symbol'] = join_symbol(group, symbol)

            job['label'] += '-e10s'
            job['name'] = add_suffix(job['name'], '-e10s')
            job['treeherder']['symbol'] = test['treeherder-symbol']

        yield job
