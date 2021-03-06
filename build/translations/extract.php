<?php
/**
 * Script for extracting translateable strings from templates and JS files.
 *
 * Also collects string from main translations JS file (which can be edited manually or autogenerated) and merges all changes
 *
 * PHP version 5
 */

libxml_use_internal_errors(true);

class Extractor
{

    protected $files = array();
    protected $trans = array();
    protected $language = 'eng';

    public function setLanguage($language)
    {
        $this->language = $language;
    }

    /**
     * Recursively collects all files from directory to $files array
     *
     * @param string $dir path to directory
     */
    public function processDir($dir)
    {
        if ($handle = opendir($dir)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }
                if (is_dir($dir . DIRECTORY_SEPARATOR .$entry)) {
                    $this->processDir($dir . DIRECTORY_SEPARATOR .$entry);
                } else {
                    $this->files [] = $dir . DIRECTORY_SEPARATOR . $entry;
                }
            }
            closedir($handle);
        }
    }

    /**
     * Collects all translateable strings(from tags with 'trans' attribute) from html templates
     *
     * @param string $file absoulute path to file
     */
    function extractFromHtml($file)
    {
        $dom = new DomDocument;
        $dom->loadHTMLFile($file);
        $xpath = new DomXPath($dom);
        $nodes = $xpath->query("//*[@trans]");
        foreach ($nodes as $i => $node) {
//            $info = "<{$node->tagName}> at $file";
            $info = "";
            if ($node->hasAttribute('context')) {
                $info = 'Context: ' .$node->getAttribute('context') . '.  '. $info;
            }
            if ($node->hasAttribute('placeholder')) {
                $this->addTranslationStr($node->getAttribute('placeholder'), $info);
            }
            if ($node->hasAttribute('title')) {
                $this->addTranslationStr($node->getAttribute('title'), $info);
            }
            if ($node->hasAttribute('data-intro')) {
                $this->addTranslationStr($node->getAttribute('data-intro'), $info);
            }
            if ($node->nodeValue != '' && $node->getAttribute('trans') != 'attr-only') {
                $this->addTranslationStr($node->nodeValue, $info);
            }
        }
    }

    /**
     * Stores string with additional information in $trans array (if already exists, just appends $info)
     *
     * @param string $str untranslated string
     * @param string $info additional info
     * @param string $translation optional, string translation
     * @param string $lang optional, defines the language for which $translation is provided
     */
    protected function addTranslationStr($str, $info, $translation = null, $lang = null)
    {
        $str = addcslashes($str, '"');
        if (isset($this->trans [$str])) {
            $this->trans [$str]['info'] .= ", $info";
        } else {
            $this->trans [$str] = array('str' => $str, 'info'=>$info);
        }
        if ($lang && $lang === $this->language &&  (!isset($this->trans[$str]['trans']) || $this->trans[$str]['trans'] == null)) {
            $this->trans [$str]['trans'] = $translation;
        }
    }


    /**
     * Collects translations from templates in provided directory
     *
     * @param string $dir absolute path to templates directory
     */
    public function extractFromTpl($dir)
    {
        $this->files = array();
        $this->processDir($dir);
        foreach ($this->files as $file) {
            $this->extractFromHtml($file);
        }
    }

    /**
     * Collects string from all js files where 'translate' filter ot service  is used
     *
     * @param string $dir absolute path to js directory
     */
    public function extractFromJsFilterOrServiceUsage($dir)
    {
        $this->files = array();
        $this->processDir($dir);
        foreach ($this->files as $file) {
            $this->extractFromFilterAndServiceUsage($file);
            $this->extractFromSpecialComments($file);
        }
    }

    /**
     * Extracts translateable strings from  file where 'translate' filter or service is used
     *
     * @param string $file absoulute path to file
     */
    protected function extractFromFilterAndServiceUsage($file)
    {
        $fileStr = file_get_contents($file);
        preg_match_all('/\$filter\(["\\\']translate["\\\']\)\(["\\\']([^"\\\']+)["\\\']\)/m', $fileStr, $matches);
        if ($matches[1]) {
            foreach($matches[1] as $str) {
                $this->addTranslationStr($str, "js filter usage at $file");
            }
        }
        unset($matches);
        preg_match_all('/\Translator\.get\(["\\\']([^"\\\']*)["\\\']\)/m', $fileStr, $matches);
        if ($matches[1]) {
           foreach($matches[1] as $str) {
                $this->addTranslationStr($str, "js Service usage at $file");
           }
        }
    }


    /**
     * Extracts translation keys from special comments looking like translate##key##
     *
     * @param string $file absoulute path to file
     */
    protected function extractFromSpecialComments($file)
    {
        $fileStr = file_get_contents($file);
        preg_match_all('/translate##(.*)##/m', $fileStr, $matches);
        if ($matches[1]) {
            foreach($matches[1] as $str) {
                $this->addTranslationStr($str, "special comment usage at $file");
            }
        }
        unset($matches);
    }

    /**
     * Generates PO file for single language
     * @param bool $withComments
     * @param null $skin
     * @return int number of translation string written
     */
    public function save($withComments = false, $skin = null)
    {
        $fh = fopen(dirname(__FILE__) . DIRECTORY_SEPARATOR .($skin ? 'skin'. DIRECTORY_SEPARATOR . $skin . DIRECTORY_SEPARATOR:'')."{$this->language}.po", 'w');
        fwrite($fh, 'msgid ""' . PHP_EOL . 'msgstr ""' . PHP_EOL . '"Content-Type: text/plain; charset=UTF-8\n"' . PHP_EOL . '"Content-Transfer-Encoding: 8bit\n"' . PHP_EOL);
        $countTrans = 0;
        $countUnTrans = 0;
        foreach ($this->trans as $originalStr => $transInfo) {
            if (strstr($originalStr,'{{')) {
                echo "\n\n\n --------------\n\n Warning: $originalStr string found.\n$transInfo\n Possible error \n\n ------------- \n\n\n";
            }
            $value = addcslashes(isset($transInfo['trans']) ?  $transInfo['trans'] : $transInfo['str'], '"');
            fwrite($fh, "\n# " . ($withComments ? $transInfo['info'] : '') . "\n");
            fwrite($fh, "msgid \"$originalStr\"\n");
            fwrite($fh, "msgstr \"$value\"\n");
            if ($originalStr != $value) {
                $countTrans++;
            } else {
                $countUnTrans++;
            }
        }
        fclose($fh);
        return array('translated' =>$countTrans, 'untranslated' => $countUnTrans);
    }

    /**
     * Extracts strings from js variable inside provided file
     *
     * @param string $file absoulute path to js file
     * @param string $varName variable name
     */
    public function extractFromJsVar($file, $varName)
    {
        $fileStr = file_get_contents($file);
        preg_match('/'.$varName.'\s*=\s*\{([^\}]*)\}/ms', $fileStr, $matches);
        if ($matches[1]) {
            foreach(json_decode('{' . $matches[1] . '}') as $k=>$v) {
                $this->addTranslationStr($v, "from $file");
            }
        }
    }

    /**
     * Extracts all translations from main js translation file
     *
     * @param string $file absoulute path to js file
     */
    public function extractFromTranslationsFile($file)
    {
        $fileStr = file_get_contents($file);
        preg_match('/angular.module\(\'vbet5\'\)\.constant\(\\\'Translations\\\'\,[\s\n]*\{(.*)\}[\s\n]*\);/ms', $fileStr, $matches);
        if ($matches[1]) {
            $decodedTranslations = json_decode('{' . $matches[1] . '}');
            if (!$decodedTranslations) {
                echo "WARNING: Cannot json decode translations from main JS translation file!\n";
                exit(-1);
            }
            foreach($decodedTranslations as $lang=>$strings) {
                foreach ($strings as $k=>$v) {
                    $this->addTranslationStr($k, "($lang - $v)", $v, $lang);
                }
            }
        } else {
            echo "WARNING: No translations found in main JS translation file!\n";
            exit(-1);
        }
    }

    /**
     * Extracts all translations from main json files
     *
     * @param string $dir absoulute path to directory containing json files
     */
    public function extractFromJsonFiles($dir)
    {
        if ($handle = opendir($dir)) {
            while (false !== ($entry = readdir($handle))) {
                $pathInfo = pathinfo($entry);
                if (strtolower($pathInfo['extension']) === 'json') {
                    $jsonFile = file_get_contents($dir . DIRECTORY_SEPARATOR . $entry);
                    $langTranslations = json_decode($jsonFile);
                    foreach($langTranslations as $lang=>$strings) {
                        foreach ($strings as $k=>$v) {
                            $this->addTranslationStr($k, "($lang - $v)", $v, $lang);
                        }
                    }
                }
            }
            closedir($handle);
        } else {
            echo "cannot open dir $path";
        }
    }
      
}


if (!isset($argv[1])) {
    echo ("Language not specified! \nUsage: " . $argv[0] . " language\n\n");
    exit(-1);
}

$language = $argv[1];
$withComments = (bool)$argv[2];
$skin = $argv[3];

$jsAppPath = realpath(dirname(__FILE__) . '/../../');
echo "Extracting translateable string for [$language]\n";
$e = new Extractor();
$e->setLanguage($language);
if ($skin) {
    $e->extractFromTpl($jsAppPath . '/skins/'. $skin . '/templates/');
    $counts = $e->save($withComments, $skin);
    die;
}
$e->extractFromTpl("$jsAppPath/templates/");
$e->extractFromJsFilterOrServiceUsage("$jsAppPath/js/");
$e->extractFromJsVar("$jsAppPath/js/modules/vbet5/filters/convertsetname.js", 'replacements');
//$e->extractFromTranslationsFile("$jsAppPath/js/modules/vbet5/translations.js");
$e->extractFromJsonFiles("$jsAppPath/languages");
$counts = $e->save($withComments);
echo "Done. \n" . ($counts['translated'] + $counts['untranslated'])." strings written to $language.po\n";
echo "(" . $counts['translated'] ." translated and " . $counts['untranslated'] . " not translated)\n";